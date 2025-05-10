// src/context/app-context.tsx
"use client";

import React, { createContext, useContext, useReducer, useEffect, useState, useCallback, type ReactNode } from 'react';
import { format, startOfDay, isSameDay } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { getUserCurrency, type Currency } from '@/services/currency';
import { fetchFromApi } from '@/lib/api'; // Ensure this path is correct
import { useAuth, type User as AuthUser } from './auth-context'; // Import useAuth

const LOCAL_STORAGE_KEY_PREFIX = 'neonShoppingState_v4_user_';

export const FREEMIUM_LIST_LIMIT = 3;
export const FREEMIUM_CATEGORY_LIMIT = 5; // Max custom categories for freemium

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'uncategorized', name: 'Uncategorized', userId: null },
  { id: 'default-electronics', name: 'Electronics', userId: null },
  { id: 'default-grocery', name: 'Grocery', userId: null },
  { id: 'default-home', name: 'Home Appliances', userId: null },
  { id: 'default-health', name: 'Health', userId: null },
  { id: 'default-fashion', name: 'Fashion', userId: null },
];

// --- Types ---
export interface ShoppingListItem {
  id: string;
  listId: string;
  userId: string;
  name: string;
  quantity: number;
  price: number;
  category: string;
  checked: boolean;
  dateAdded: number; // Milliseconds timestamp
}

export interface Category {
  id: string;
  name: string;
  userId: string | null;
}

export interface List {
  id: string;
  userId: string;
  name: string;
  budgetLimit: number;
  defaultCategory: string;
}

interface UserPreferences {
  currency: Currency;
  isPremium: boolean; // This is based on subscription status from backend
}

interface AppState {
  userId: string | null;
  currency: Currency;
  lists: List[];
  selectedListId: string | null;
  shoppingListItems: ShoppingListItem[];
  categories: Category[];
  isLoading: boolean; // App-specific data loading
  isPremium: boolean; // Synced from AuthContext based on backend data
  theme: string;
}

interface AppContextProps {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  formatCurrency: (amount: number) => string;
  isLoading: boolean;
}

const defaultCurrency: Currency = { code: 'USD', symbol: '$', name: 'US Dollar' };
const defaultThemeId = 'cyberpunk-cyan'; // Make sure this matches a theme in your config

const initialState: AppState = {
  userId: null,
  currency: defaultCurrency,
  lists: [],
  selectedListId: null,
  shoppingListItems: [],
  categories: [...DEFAULT_CATEGORIES],
  isLoading: true,
  isPremium: false,
  theme: defaultThemeId,
};

type Action =
  | { type: 'LOAD_STATE'; payload: Partial<AppState> & { userId: string | null } }
  | { type: 'LOAD_DATA_FROM_API'; payload: { lists: List[]; items: ShoppingListItem[]; categories: Category[]; userPreferences: Partial<UserPreferences> } }
  | { type: 'SET_USER_CONTEXT_IN_APP'; payload: { userId: string | null; isPremium: boolean } }
  | { type: 'SET_CURRENCY'; payload: Currency }
  | { type: 'ADD_LIST'; payload: List }
  | { type: 'UPDATE_LIST'; payload: List }
  | { type: 'DELETE_LIST'; payload: string }
  | { type: 'SELECT_LIST'; payload: string | null }
  | { type: 'ADD_SHOPPING_ITEM'; payload: ShoppingListItem }
  | { type: 'UPDATE_SHOPPING_ITEM'; payload: ShoppingListItem }
  | { type: 'REMOVE_SHOPPING_ITEM'; payload: string }
  | { type: 'TOGGLE_SHOPPING_ITEM'; payload: string }
  | { type: 'ADD_CATEGORY'; payload: Category }
  | { type: 'UPDATE_CATEGORY'; payload: { id: string; name: string } }
  | { type: 'REMOVE_CATEGORY'; payload: { categoryId: string; reassignToId?: string } }
  | { type: 'SET_APP_LOADING'; payload: boolean }
  | { type: 'SET_PREMIUM_STATUS_IN_APP'; payload: boolean } // For manual override, e.g. from PremiumPage test button
  | { type: 'SET_THEME'; payload: string }
  | { type: 'RESET_APP_STATE_FOR_LOGOUT' };

const mergeCategories = (defaultCats: Category[], apiCats: Category[]): Category[] => {
  const categoryMap = new Map<string, Category>();
  // Add default global categories first
  defaultCats.forEach(cat => categoryMap.set(cat.id, { ...cat, userId: null }));
  // Then add/override with API categories (which include user-specific and potentially admin-edited global ones)
  apiCats.forEach(cat => categoryMap.set(cat.id, cat));
  return Array.from(categoryMap.values());
};

function appReducer(state: AppState, action: Action): AppState {
  let newState = { ...state };

  switch (action.type) {
    case 'LOAD_STATE': {
      const { userId: loadedUserId, ...restOfPayload } = action.payload;
      newState = {
        ...initialState, // Base on initial state
        userId: loadedUserId,
        ...restOfPayload,
        theme: restOfPayload.theme || defaultThemeId,
        currency: restOfPayload.currency || initialState.currency,
        // isLoading will be set by useEffects watching authState or by API calls
      };
      // Ensure default categories are present, merge with loaded ones if they exist
      const loadedCategories = restOfPayload.categories && restOfPayload.categories.length > 0
        ? restOfPayload.categories
        : [];
      newState.categories = mergeCategories(DEFAULT_CATEGORIES, loadedCategories);
      
      newState.isPremium = restOfPayload.isPremium ?? initialState.isPremium;
      
      // Logic for selecting the first list IF lists are loaded from localStorage and user is the same
      if (loadedUserId && newState.lists && Array.isArray(newState.lists) && newState.lists.length > 0) {
        const userLists = newState.lists.filter(l => l.userId === loadedUserId);
        if (userLists.length > 0) {
            // If there was a selectedListId from storage, and it's valid for this user, keep it. Otherwise, pick first.
            const currentSelectedListIsValid = userLists.some(l => l.id === newState.selectedListId);
            newState.selectedListId = currentSelectedListIsValid ? newState.selectedListId : userLists[0].id;
        } else {
            newState.selectedListId = null;
        }
      } else {
        newState.selectedListId = null;
      }
      console.log("AppReducer: LOAD_STATE processed for user:", loadedUserId, "New app state:", newState);
      break;
    }
    case 'LOAD_DATA_FROM_API': {
      const { lists, items, categories: apiCategories, userPreferences } = action.payload;
      newState = {
        ...state,
        lists: lists || state.lists, // Fallback to existing state if API doesn't provide
        shoppingListItems: items || state.shoppingListItems,
        categories: apiCategories ? mergeCategories(DEFAULT_CATEGORIES, apiCategories) : state.categories,
        currency: userPreferences.currency || state.currency,
        isPremium: userPreferences.isPremium !== undefined ? userPreferences.isPremium : state.isPremium,
        isLoading: false, // Data loaded from API, set loading to false
      };
      // After loading API data, re-evaluate selectedListId
      if (state.userId && newState.lists && Array.isArray(newState.lists)) {
        const userListsFromApi = newState.lists.filter(l => l.userId === state.userId);
        if (userListsFromApi.length > 0) {
          const currentSelectedListStillExists = userListsFromApi.some(l => l.id === state.selectedListId);
          newState.selectedListId = currentSelectedListStillExists ? state.selectedListId : userListsFromApi[0].id;
        } else {
          newState.selectedListId = null; // No lists for this user from API
        }
      } else if (!state.userId || (newState.lists && Array.isArray(newState.lists) && newState.lists.length === 0)) {
        newState.selectedListId = null; // No user or no lists at all
      }
      console.log("AppReducer: LOAD_DATA_FROM_API processed. New app state:", newState);
      break;
    }
    case 'SET_USER_CONTEXT_IN_APP': {
        const { userId: newUserId, isPremium: newIsPremium } = action.payload;
        const oldUserId = state.userId;
        
        newState = { 
            ...state, 
            userId: newUserId, 
            isPremium: newIsPremium,
        };

        if (newUserId !== oldUserId) {
            // User has changed (logged in with a different account or anonymous session started)
            // Reset lists and items, they will be reloaded by API or from new user's localStorage.
            // Keep global settings like theme and currency unless specifically reset.
            newState.lists = [];
            newState.shoppingListItems = [];
            newState.selectedListId = null;
            // Categories also need to be re-evaluated. Keep defaults, user-specific will load.
            newState.categories = [...DEFAULT_CATEGORIES];
            // If the new user is authenticated (not anon), set isLoading to true to trigger API fetch.
            // If new user is anonymous, isLoading will be false after initial localStorage load.
            newState.isLoading = (newUserId && !newUserId.startsWith('anon_'));
        }
        console.log("AppReducer: SET_USER_CONTEXT_IN_APP for user:", newUserId, "Premium:", newIsPremium, "New app state:", newState);
        break;
    }
    case 'SET_CURRENCY':
      newState = { ...state, currency: action.payload, isLoading: false };
      if (state.userId && !state.userId.startsWith('anon_')) {
         fetchFromApi('user/preferences.php', {
           method: 'POST',
           body: JSON.stringify({ currencyCode: action.payload.code, userId: state.userId }),
         }).catch(err => console.error("Failed to save currency preference to backend:", err));
      }
      break;
    case 'ADD_LIST': {
      if (!state.userId) { console.warn("Cannot add list: No user ID"); return state; }
      const userOwnedLists = newState.lists.filter(l => l.userId === state.userId);
      if (!state.isPremium && userOwnedLists.length >= FREEMIUM_LIST_LIMIT) {
         console.warn("Freemium list limit reached."); return state; // Or show toast
      }
      const newListWithUserId = { ...action.payload, userId: state.userId };
      newState.lists = [...newState.lists, newListWithUserId];
      if (userOwnedLists.length === 0 || !newState.selectedListId) { // Select if first list or no list selected
        newState.selectedListId = newListWithUserId.id;
      }
      break;
    }
    case 'UPDATE_LIST': {
      if (!state.userId || action.payload.userId !== state.userId) return state; // Ensure correct user
      newState.lists = newState.lists.map(list =>
        list.id === action.payload.id ? { ...action.payload, userId: state.userId } : list
      );
      break;
    }
    case 'DELETE_LIST': {
      const listToDelete = newState.lists.find(l => l.id === action.payload);
      if (!listToDelete || !state.userId || listToDelete.userId !== state.userId) return state;

      newState.lists = newState.lists.filter(list => list.id !== action.payload);
      // Remove items associated with the deleted list for the current user
      newState.shoppingListItems = newState.shoppingListItems.filter(item =>
        !(item.listId === action.payload && item.userId === state.userId)
      );
      if (newState.selectedListId === action.payload) {
        const userListsRemaining = newState.lists.filter(l => l.userId === state.userId);
        newState.selectedListId = userListsRemaining.length > 0 ? userListsRemaining[0].id : null;
      }
      break;
    }
    case 'SELECT_LIST': {
      const listToSelect = newState.lists.find(l => l.id === action.payload);
      // Allow selecting null (to deselect) or a list belonging to the current user
      if (action.payload === null || (listToSelect && state.userId && listToSelect.userId === state.userId)) {
          newState.selectedListId = action.payload;
      }
      break;
    }
    case 'ADD_SHOPPING_ITEM': {
       if (!state.userId || !action.payload.listId || action.payload.userId !== state.userId) {
         console.error("ADD_SHOPPING_ITEM: User ID or List ID mismatch/missing. State UserID:", state.userId, "Item Payload:", action.payload);
         return state;
       }
      // Ensure the item has the correct userId before adding
      newState.shoppingListItems = [...newState.shoppingListItems, { ...action.payload, userId: state.userId }];
      break;
    }
    case 'UPDATE_SHOPPING_ITEM': {
      if (!state.userId || action.payload.userId !== state.userId) return state; // Ensure correct user
      newState.shoppingListItems = newState.shoppingListItems.map(item =>
        item.id === action.payload.id ? { ...action.payload, userId: state.userId } : item
      );
      break;
    }
    case 'REMOVE_SHOPPING_ITEM': {
      const itemToRemove = newState.shoppingListItems.find(item => item.id === action.payload);
      if (!itemToRemove || !state.userId || itemToRemove.userId !== state.userId) return state;
      newState.shoppingListItems = newState.shoppingListItems.filter(item => item.id !== action.payload);
      break;
    }
    case 'TOGGLE_SHOPPING_ITEM': {
      const itemToToggle = newState.shoppingListItems.find(item => item.id === action.payload);
      if (!itemToToggle || !state.userId || itemToToggle.userId !== state.userId) return state;
      newState.shoppingListItems = newState.shoppingListItems.map(item =>
        item.id === action.payload ? { ...item, checked: !item.checked, dateAdded: Date.now(), userId: state.userId } : item
      );
      break;
    }
    case 'ADD_CATEGORY': {
      if (!state.userId) { console.warn("Cannot add category: No user ID"); return state; }
      // User specific categories are those with matching userId
      const userCustomCategories = newState.categories.filter(c => c.userId === state.userId);
      if (!state.isPremium && userCustomCategories.length >= FREEMIUM_CATEGORY_LIMIT) {
         console.warn("Freemium custom category limit reached."); return state; // Or show toast
      }
      // New categories added by user should have their userId
      const newCategoryWithUserId = { ...action.payload, userId: state.userId };
      newState.categories = [...newState.categories, newCategoryWithUserId];
      break;
    }
    case 'UPDATE_CATEGORY': {
      const categoryToUpdate = newState.categories.find(c => c.id === action.payload.id);
      if (!categoryToUpdate) return state;
      // User can update their own categories (userId matches)
      // Premium users can update default/global categories (userId is null)
      const canUpdate = (categoryToUpdate.userId === state.userId) || (categoryToUpdate.userId === null && state.isPremium);
      if (!canUpdate) {
          console.warn("User not authorized to update this category."); return state;
      }
      newState.categories = newState.categories.map(cat =>
        cat.id === action.payload.id ? { ...cat, name: action.payload.name } : cat
      );
      break;
    }
    case 'REMOVE_CATEGORY': {
      const categoryToRemove = newState.categories.find(c => c.id === action.payload.categoryId);
      if (!categoryToRemove || categoryToRemove.id === 'uncategorized') return state; // Cannot delete 'uncategorized'
      // User can remove their own categories. Premium can remove default global categories.
      const canRemove = (categoryToRemove.userId === state.userId) || (categoryToRemove.userId === null && state.isPremium);
      if (!canRemove) {
          console.warn("User not authorized to delete this category."); return state;
      }
      newState.categories = newState.categories.filter(cat => cat.id !== action.payload.categoryId);
      // Reassign items and list defaults if necessary (only for items/lists belonging to current user)
      if (state.userId) {
        const reassignId = action.payload.reassignToId || 'uncategorized';
        newState.shoppingListItems = newState.shoppingListItems.map(item =>
          item.category === action.payload.categoryId && item.userId === state.userId ? { ...item, category: reassignId, userId: state.userId } : item
        );
        newState.lists = newState.lists.map(list =>
          list.defaultCategory === action.payload.categoryId && list.userId === state.userId ? { ...list, defaultCategory: reassignId, userId: state.userId } : list
        );
      }
      break;
    }
    case 'SET_APP_LOADING':
      newState = { ...state, isLoading: action.payload };
      break;
    case 'SET_PREMIUM_STATUS_IN_APP': // For direct control from PremiumPage test buttons
      newState = { ...state, isPremium: action.payload };
      break;
    case 'SET_THEME':
      newState = { ...state, theme: action.payload };
      break;
    case 'RESET_APP_STATE_FOR_LOGOUT': {
        // Called when user logs out from AuthContext
        const anonId = `anon_${uuidv4()}`;
        const preservedCurrency = state.currency; // Preserve user's chosen currency
        const preservedTheme = state.theme; // Preserve user's chosen theme
        
        newState = {
            ...initialState, // Reset to initial default state
            userId: anonId, // Assign a new anonymous ID
            isLoading: false, // Not loading API data for anon user by default after this reset
            currency: preservedCurrency, // Restore currency
            theme: preservedTheme,       // Restore theme
        };
        console.log("AppReducer: RESET_APP_STATE_FOR_LOGOUT. New anonymous UserID:", anonId);
        // Clear localStorage for the logged-out authenticated user
        if (typeof window !== 'undefined' && state.userId && !state.userId.startsWith('anon_')) {
          localStorage.removeItem(`${LOCAL_STORAGE_KEY_PREFIX}${state.userId}`);
        }
        // Save initial state for new anonymous user
        localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${anonId}`, JSON.stringify(newState));
        break;
      }
    default:
      newState = state;
  }

  // Save state to localStorage, prefixed by userId, only if userId is present
  if (newState.userId && typeof window !== 'undefined' && action.type !== 'SET_APP_LOADING') {
    try {
      const { isLoading: _omittedIsLoading, ...stateToSave } = newState; // Don't save isLoading state to localStorage
      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${newState.userId}`, JSON.stringify(stateToSave));
      console.log(`AppReducer: Saved state to localStorage for user: ${newState.userId}. Action Type: ${action.type}`);
    } catch (error) {
      console.error("Failed to save state to localStorage for user:", newState.userId, error);
    }
  }
  return newState;
}

export const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [isInitialLocalStateLoaded, setIsInitialLocalStateLoaded] = useState(false);
  const { user: authUser, isAuthenticated, isLoading: authIsLoading } = useAuth();

  // Effect 1: Load initial state from localStorage (or generate anonymous ID)
  useEffect(() => {
    if (isInitialLocalStateLoaded) return;

    const loadLocalState = async () => {
      dispatch({ type: 'SET_APP_LOADING', payload: true }); // Start with app loading true
      let finalUserIdToLoadFor: string | null = null;
      let loadedStateFromStorage: Partial<AppState> = {};

      if (typeof window !== 'undefined') {
        const lastActiveUserId = localStorage.getItem(LOCAL_STORAGE_KEY_PREFIX + "lastActiveUser");
        
        // If AuthContext is still loading, we might use lastActiveUser or generate anon
        // If AuthContext is resolved and user is authenticated, that ID will take precedence shortly
        finalUserIdToLoadFor = lastActiveUserId || `anon_${uuidv4()}`;
        
        console.log("AppProvider (Effect 1): Determined UserID for initial localStorage load:", finalUserIdToLoadFor);
        const storedStateRaw = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${finalUserIdToLoadFor}`);
        if (storedStateRaw) {
          try {
            loadedStateFromStorage = JSON.parse(storedStateRaw) as Omit<AppState, 'isLoading' | 'isPremium'>;
            console.log(`AppProvider (Effect 1): Parsed stored state for user ${finalUserIdToLoadFor}.`);
          } catch (e) {
            console.error(`AppProvider (Effect 1): Failed to parse stored state for ${finalUserIdToLoadFor}. Error:`, e);
            localStorage.removeItem(`${LOCAL_STORAGE_KEY_PREFIX}${finalUserIdToLoadFor}`);
          }
        } else {
          console.log(`AppProvider (Effect 1): No stored state for ${finalUserIdToLoadFor}. Using defaults.`);
        }
      } else {
        finalUserIdToLoadFor = `anon_${uuidv4()}`; // Fallback for non-browser env (shouldn't happen)
      }

      // Auto-detect currency if not present in loaded state
      let currencyToSet = loadedStateFromStorage.currency || defaultCurrency;
      if (!loadedStateFromStorage.currency) {
        try {
          const detectedCurrency = await getUserCurrency(); // Ensure getUserCurrency is robust
          currencyToSet = detectedCurrency || defaultCurrency;
          console.log("AppProvider (Effect 1): Currency detection result:", currencyToSet.code);
        } catch (e) { console.error("AppProvider (Effect 1): Currency auto-detection error:", e); }
      }
      loadedStateFromStorage.currency = currencyToSet;
      loadedStateFromStorage.theme = loadedStateFromStorage.theme || defaultThemeId;

      // Dispatch LOAD_STATE with the determined userId and loaded data
      dispatch({ type: 'LOAD_STATE', payload: { ...loadedStateFromStorage, userId: finalUserIdToLoadFor } });
      setIsInitialLocalStateLoaded(true); // Mark local state load as complete
      console.log("AppProvider (Effect 1): Initial local state loading finished. UserID:", finalUserIdToLoadFor);
      // isLoading remains true here, will be set by subsequent effects/API calls
    };

    loadLocalState();
  }, [isInitialLocalStateLoaded]);


  // Effect 2: React to authentication changes from AuthContext
  useEffect(() => {
    // Wait for both initial local state and auth state to be resolved
    if (!isInitialLocalStateLoaded || authIsLoading) {
      return;
    }

    console.log("AppProvider (Effect 2): Auth state observed. AuthUser:", authUser, "IsAuthenticated:", isAuthenticated, "Current App UserID:", state.userId);

    if (isAuthenticated && authUser) {
      // User is authenticated
      // Update AppContext with authenticated user's ID and premium status
      // This also triggers localStorage switch if userId changes
      if (state.userId !== authUser.id || state.isPremium !== (authUser.isPremium ?? false)) {
        console.log(`AppProvider (Effect 2): Auth user (${authUser.id}) context update. Dispatching SET_USER_CONTEXT_IN_APP.`);
        dispatch({
          type: 'SET_USER_CONTEXT_IN_APP',
          payload: { userId: authUser.id, isPremium: authUser.isPremium ?? false }
        });
        if (typeof window !== 'undefined') {
          localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + "lastActiveUser", authUser.id);
        }
      }
    } else {
      // User is not authenticated (logged out or session expired / initial anonymous state)
      // If current app userId is an authenticated one, reset to anonymous
      if (state.userId && !state.userId.startsWith('anon_')) {
        console.log("AppProvider (Effect 2): User logged out or session ended. Dispatching RESET_APP_STATE_FOR_LOGOUT.");
        dispatch({ type: 'RESET_APP_STATE_FOR_LOGOUT' });
      } else if (!state.userId || (state.userId && !state.userId.startsWith('anon_'))) {
        // If there's no userId in app state yet, or it was an old auth'd user ID and now auth is false,
        // ensure an anonymous session is started.
        const anonId = `anon_${uuidv4()}`;
        console.log(`AppProvider (Effect 2): Ensuring anonymous context. New anon UserID: ${anonId}`);
        dispatch({ type: 'SET_USER_CONTEXT_IN_APP', payload: { userId: anonId, isPremium: false } });
         if (typeof window !== 'undefined') {
           localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + "lastActiveUser", anonId);
         }
      }
      // If already anonymous (state.userId.startsWith('anon_')), no specific action needed here unless premium status needs sync
      // Note: isPremium for anon user should always be false.
      if (state.userId && state.userId.startsWith('anon_') && state.isPremium) {
        dispatch({ type: 'SET_USER_CONTEXT_IN_APP', payload: { userId: state.userId, isPremium: false } });
      }
    }
  }, [isAuthenticated, authUser, authIsLoading, isInitialLocalStateLoaded, state.userId, state.isPremium]);


  // Effect 3: Fetch API data when an authenticated (non-anonymous) userId is set AND AppContext.isLoading is true
  useEffect(() => {
    const fetchApiDataForUser = async () => {
      // Only fetch if we have an authenticated (non-anon) user and app is in loading state (implies user changed or initial auth load)
      if (state.userId && !state.userId.startsWith('anon_') && state.isLoading) {
        console.log(`AppProvider (Effect 3): Fetching API data for authenticated user ${state.userId}...`);
        try {
          const apiResponse = await fetchFromApi(`data/index.php`, { method: 'GET' });
          if (apiResponse.success && apiResponse.data) {
            const { lists = [], items = [], categories: apiCategories = [], user_preferences = {} } = apiResponse.data;
            // Determine premium status: from API if available, else from AuthContext (which gets it from session_status.php)
            const premiumStatusFromApi = user_preferences.is_premium;
            const finalIsPremium = premiumStatusFromApi !== undefined ? premiumStatusFromApi : state.isPremium;

            dispatch({
              type: 'LOAD_DATA_FROM_API',
              payload: {
                lists,
                items,
                categories: apiCategories,
                userPreferences: {
                  currency: user_preferences.currency || state.currency,
                  isPremium: finalIsPremium, // Use API's premium status if available
                }
              }
            });
            console.log(`AppProvider (Effect 3): Successfully fetched API data for user ${state.userId}. Premium: ${finalIsPremium}`);
          } else {
            console.error("AppProvider (Effect 3): API data fetch failed for user:", state.userId, "Message:", apiResponse?.message);
            dispatch({ type: 'SET_APP_LOADING', payload: false });
          }
        } catch (error) {
          console.error("AppProvider (Effect 3): Exception during API data fetch for user:", state.userId, error);
          dispatch({ type: 'SET_APP_LOADING', payload: false });
        }
      } else if (state.isLoading && state.userId && state.userId.startsWith('anon_')) {
        // For anonymous users, after initial local state load, set isLoading to false.
        console.log("AppProvider (Effect 3): User is anonymous, setting isLoading to false (no API fetch).");
        dispatch({ type: 'SET_APP_LOADING', payload: false });
      }
    };

    if (isInitialLocalStateLoaded && !authIsLoading) { // Ensure auth is also resolved before trying to fetch API data
        fetchApiDataForUser();
    }
  }, [state.userId, state.isLoading, isInitialLocalStateLoaded, authIsLoading, state.currency, state.isPremium]);


  const formatCurrency = useCallback((amount: number) => {
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: state.currency.code,
      }).format(amount);
    } catch (error) {
      console.warn("Currency formatting error, using fallback for:", state.currency.code, error);
      return `${state.currency.symbol || '$'}${amount.toFixed(2)}`;
    }
  }, [state.currency]);

  return (
    <AppContext.Provider value={{ state, dispatch, formatCurrency, isLoading: state.isLoading }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextProps => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
