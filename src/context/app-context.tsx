// src/context/app-context.tsx
"use client";

import React, { createContext, useContext, useReducer, useEffect, useState, useCallback, type ReactNode } from 'react';
import { format, startOfDay, isSameDay } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { getUserCurrency, type Currency } from '@/services/currency';
import { fetchFromApi } from '@/lib/api';
import { useAuth } from './auth-context'; // Import useAuth

const LOCAL_STORAGE_KEY_PREFIX = 'neonShoppingState_v4_user_'; // Prefix for user-specific storage

export const FREEMIUM_LIST_LIMIT = 3;
export const FREEMIUM_CATEGORY_LIMIT = 5;

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
  userId: string; // To associate item with a user
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
  userId: string | null; // null for default categories, userId for user-created
}

export interface List {
  id: string;
  userId: string; // To associate list with a user
  name: string;
  budgetLimit: number;
  defaultCategory: string; // Store category ID
}

interface UserPreferences {
  currency: Currency;
  isPremium: boolean;
}

interface AppState {
  userId: string | null; // Can be null if not logged in (or anonymous)
  currency: Currency;
  lists: List[];
  selectedListId: string | null;
  shoppingListItems: ShoppingListItem[];
  categories: Category[];
  isLoading: boolean; // App-specific loading (e.g., for API data)
  isPremium: boolean; // Premium status, synced from AuthContext
  theme: string;
}

interface AppContextProps {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  formatCurrency: (amount: number) => string;
  isLoading: boolean; // Expose app-specific loading
}

const defaultCurrency: Currency = { code: 'USD', symbol: '$', name: 'US Dollar' };
const defaultThemeId = 'cyberpunk-cyan';

const initialState: AppState = {
  userId: null, // Start as null, will be set by auth or anonymous ID generation
  currency: defaultCurrency,
  lists: [],
  selectedListId: null,
  shoppingListItems: [],
  categories: [...DEFAULT_CATEGORIES],
  isLoading: true, // True initially until auth and initial data load resolves
  isPremium: false,
  theme: defaultThemeId,
};

type Action =
  | { type: 'LOAD_STATE'; payload: Partial<AppState> & { userId: string | null } } // userId can be null for anon
  | { type: 'LOAD_DATA_FROM_API'; payload: { lists: List[]; items: ShoppingListItem[]; categories: Category[]; userPreferences: Partial<UserPreferences> } }
  | { type: 'SET_USER_CONTEXT_IN_APP'; payload: { userId: string | null; isPremium: boolean } } // Renamed to avoid clash
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
  | { type: 'SET_PREMIUM_STATUS_IN_APP'; payload: boolean } // Renamed to avoid clash
  | { type: 'SET_THEME'; payload: string }
  | { type: 'RESET_APP_STATE_FOR_LOGOUT' }; // Renamed to avoid clash

const mergeCategories = (defaultCats: Category[], userCats: Category[]): Category[] => {
  const categoryMap = new Map<string, Category>();
  defaultCats.forEach(cat => categoryMap.set(cat.id, { ...cat, userId: null }));
  userCats.forEach(cat => categoryMap.set(cat.id, cat)); // User's categories override defaults if IDs match
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
        isLoading: true, // Always true after this as we might fetch API data
      };
      newState.categories = (restOfPayload.categories && restOfPayload.categories.length > 0)
        ? mergeCategories(DEFAULT_CATEGORIES, restOfPayload.categories.filter(c => c.userId === loadedUserId || c.userId === null))
        : [...DEFAULT_CATEGORIES];
      
      newState.isPremium = restOfPayload.isPremium ?? initialState.isPremium;
      
      if (loadedUserId && newState.lists && Array.isArray(newState.lists)) {
        const userLists = newState.lists.filter(l => l.userId === loadedUserId);
        if (userLists.length > 0 && !userLists.some(l => l.id === newState.selectedListId)) {
            newState.selectedListId = userLists[0].id;
        } else if (userLists.length === 0) {
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
        lists: lists || state.lists,
        shoppingListItems: items || state.shoppingListItems,
        categories: apiCategories ? mergeCategories(DEFAULT_CATEGORIES, apiCategories) : state.categories,
        currency: userPreferences.currency || state.currency,
        isPremium: userPreferences.isPremium !== undefined ? userPreferences.isPremium : state.isPremium,
        isLoading: false,
      };
      if (state.userId && newState.lists && Array.isArray(newState.lists)) {
        const userListsFromApi = newState.lists.filter(l => l.userId === state.userId);
        if (userListsFromApi.length > 0) {
          const currentSelectedListStillExists = userListsFromApi.some(l => l.id === state.selectedListId);
          newState.selectedListId = currentSelectedListStillExists ? state.selectedListId : userListsFromApi[0].id;
        } else {
          newState.selectedListId = null;
        }
      } else if (newState.lists && Array.isArray(newState.lists) && newState.lists.length === 0) {
        newState.selectedListId = null;
      }
      console.log("AppReducer: LOAD_DATA_FROM_API processed. New app state:", newState);
      break;
    }
    case 'SET_USER_CONTEXT_IN_APP': {
        newState = { 
            ...state, 
            userId: action.payload.userId, 
            isPremium: action.payload.isPremium,
            // When user context changes, we might need to reload data or clear existing user-specific data.
            // If userId is new and not anon, set isLoading to true to trigger API fetch.
            // If userId is null (logout), RESET_APP_STATE_FOR_LOGOUT should be used.
            isLoading: (action.payload.userId && !action.payload.userId.startsWith('anon_')) ? true : false,
            // Reset lists/items if user changes, they will be reloaded by API or from storage.
            lists: action.payload.userId === state.userId ? state.lists : [],
            shoppingListItems: action.payload.userId === state.userId ? state.shoppingListItems : [],
            selectedListId: action.payload.userId === state.userId ? state.selectedListId : null,
        };
        console.log("AppReducer: SET_USER_CONTEXT_IN_APP for user:", action.payload.userId, "Premium:", action.payload.isPremium, "New app state:", newState);
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
    case 'ADD_LIST':
      if (!state.userId) return state;
      const userLists = newState.lists.filter(l => l.userId === state.userId);
      if (!state.isPremium && userLists.length >= FREEMIUM_LIST_LIMIT) {
         console.warn("Freemium list limit reached."); return state;
      }
      const newListWithUserId = { ...action.payload, userId: state.userId };
      newState.lists = [...newState.lists, newListWithUserId];
      if (userLists.length === 0 || newState.selectedListId === null) {
        newState.selectedListId = newListWithUserId.id;
      }
      break;
    case 'UPDATE_LIST':
      if (!state.userId || action.payload.userId !== state.userId) return state;
      newState.lists = newState.lists.map(list =>
        list.id === action.payload.id ? { ...action.payload, userId: state.userId } : list
      );
      break;
    case 'DELETE_LIST':
      const listToDelete = newState.lists.find(l => l.id === action.payload);
      if (!listToDelete || !state.userId || listToDelete.userId !== state.userId) return state;
      newState.lists = newState.lists.filter(list => list.id !== action.payload);
      newState.shoppingListItems = newState.shoppingListItems.filter(item =>
        !(item.listId === action.payload && item.userId === state.userId)
      );
      if (newState.selectedListId === action.payload) {
        const userListsRemaining = newState.lists.filter(l => l.userId === state.userId);
        newState.selectedListId = userListsRemaining.length > 0 ? userListsRemaining[0].id : null;
      }
      break;
    case 'SELECT_LIST':
      const listToSelect = newState.lists.find(l => l.id === action.payload);
      if (action.payload === null || (listToSelect && state.userId && listToSelect.userId === state.userId)) {
          newState.selectedListId = action.payload;
      }
      break;
    case 'ADD_SHOPPING_ITEM':
       if (!state.userId || !action.payload.listId || action.payload.userId !== state.userId) {
         console.error("ADD_SHOPPING_ITEM: Mismatch or missing IDs. State UserID:", state.userId, "Item Payload:", action.payload);
         return state;
       }
      newState.shoppingListItems = [...newState.shoppingListItems, { ...action.payload, userId: state.userId }];
      break;
    case 'UPDATE_SHOPPING_ITEM':
      if (!state.userId || action.payload.userId !== state.userId) return state;
      newState.shoppingListItems = newState.shoppingListItems.map(item =>
        item.id === action.payload.id ? { ...action.payload, userId: state.userId } : item
      );
      break;
    case 'REMOVE_SHOPPING_ITEM':
      const itemToRemove = newState.shoppingListItems.find(item => item.id === action.payload);
      if (!itemToRemove || !state.userId || itemToRemove.userId !== state.userId) return state;
      newState.shoppingListItems = newState.shoppingListItems.filter(item => item.id !== action.payload);
      break;
    case 'TOGGLE_SHOPPING_ITEM':
      const itemToToggle = newState.shoppingListItems.find(item => item.id === action.payload);
      if (!itemToToggle || !state.userId || itemToToggle.userId !== state.userId) return state;
      newState.shoppingListItems = newState.shoppingListItems.map(item =>
        item.id === action.payload ? { ...item, checked: !item.checked, dateAdded: Date.now(), userId: state.userId } : item
      );
      break;
    case 'ADD_CATEGORY':
      if (!state.userId) { console.warn("Cannot add category: No user ID"); return state; }
      const userCustomCategories = newState.categories.filter(c => c.userId === state.userId);
      if (!state.isPremium && userCustomCategories.length >= FREEMIUM_CATEGORY_LIMIT) {
         console.warn("Freemium custom category limit reached."); return state;
      }
      const newCategoryWithUserId = { ...action.payload, userId: state.userId };
      newState.categories = [...newState.categories, newCategoryWithUserId];
      break;
    case 'UPDATE_CATEGORY':
      const categoryToUpdate = newState.categories.find(c => c.id === action.payload.id);
      if (!categoryToUpdate) return state;
      const canUpdate = (categoryToUpdate.userId === state.userId) || (categoryToUpdate.userId === null && state.isPremium);
      if (!canUpdate) {
          console.warn("User not authorized to update this category."); return state;
      }
      newState.categories = newState.categories.map(cat =>
        cat.id === action.payload.id ? { ...cat, name: action.payload.name } : cat
      );
      break;
    case 'REMOVE_CATEGORY':
      const categoryToRemove = newState.categories.find(c => c.id === action.payload.categoryId);
      if (!categoryToRemove || categoryToRemove.id === 'uncategorized') return state;
      const canRemove = (categoryToRemove.userId === state.userId) || (categoryToRemove.userId === null && state.isPremium);
      if (!canRemove) {
          console.warn("User not authorized to delete this category."); return state;
      }
      newState.categories = newState.categories.filter(cat => cat.id !== action.payload.categoryId);
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
    case 'SET_APP_LOADING':
      newState = { ...state, isLoading: action.payload };
      break;
    case 'SET_PREMIUM_STATUS_IN_APP':
      newState = { ...state, isPremium: action.payload };
      break;
    case 'SET_THEME':
      newState = { ...state, theme: action.payload };
      break;
    case 'RESET_APP_STATE_FOR_LOGOUT': {
        const anonId = `anon_${uuidv4()}`;
        newState = {
            ...initialState, // Reset to initial default state
            userId: anonId, // Assign a new anonymous ID
            isLoading: false,
            currency: state.currency, // Preserve currency choice
            theme: state.theme, // Preserve theme choice
        };
        console.log("AppReducer: RESET_APP_STATE_FOR_LOGOUT. New anonymous UserID:", anonId);
        // Clear localStorage for the logged-out user
        if (typeof window !== 'undefined' && state.userId && !state.userId.startsWith('anon_')) {
          localStorage.removeItem(`${LOCAL_STORAGE_KEY_PREFIX}${state.userId}`);
        }
        break;
      }
    default:
      newState = state;
  }

  // Save state to localStorage, prefixed by userId
  if (newState.userId && typeof window !== 'undefined' && action.type !== 'SET_APP_LOADING') {
    try {
      const { isLoading: _omittedIsLoading, ...stateToSave } = newState;
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
  const [isInitialDataLoaded, setIsInitialDataLoaded] = useState(false);
  const { user: authUser, isAuthenticated, isLoading: authIsLoading } = useAuth();

  // Effect for loading initial state from localStorage and auto-detecting currency (once)
  useEffect(() => {
    if (isInitialDataLoaded) return;

    const loadInitialData = async () => {
      dispatch({ type: 'SET_APP_LOADING', payload: true });
      let finalUserIdToLoadFor: string | null = null;
      let loadedStateFromStorage: Partial<AppState> = {};

      if (typeof window !== 'undefined') {
        const lastActiveUserId = localStorage.getItem(LOCAL_STORAGE_KEY_PREFIX + "lastActiveUser");
        
        // Prioritize authenticated user if available from AuthContext and not loading
        if (!authIsLoading && isAuthenticated && authUser) {
          finalUserIdToLoadFor = authUser.id;
        } else if (lastActiveUserId) {
          finalUserIdToLoadFor = lastActiveUserId;
        } else {
          finalUserIdToLoadFor = `anon_${uuidv4()}`;
        }

        console.log("AppProvider: Determined UserID for initial load:", finalUserIdToLoadFor);
        const storedStateRaw = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${finalUserIdToLoadFor}`);
        if (storedStateRaw) {
          try {
            loadedStateFromStorage = JSON.parse(storedStateRaw) as Omit<AppState, 'isLoading' | 'isPremium'>;
            console.log(`AppProvider: Successfully parsed stored state for user ${finalUserIdToLoadFor}.`);
          } catch (e) {
            console.error(`AppProvider: Failed to parse stored state for user ${finalUserIdToLoadFor}. Error:`, e);
            localStorage.removeItem(`${LOCAL_STORAGE_KEY_PREFIX}${finalUserIdToLoadFor}`);
            // If parsing fails, we still proceed with finalUserIdToLoadFor, but with empty stored state
          }
        } else {
          console.log(`AppProvider: No stored state found for user ${finalUserIdToLoadFor}. Will use defaults.`);
        }
      } else { // Should not happen in browser, but good fallback
        finalUserIdToLoadFor = `anon_${uuidv4()}`;
      }

      // Ensure userId is part of the payload for LOAD_STATE
      loadedStateFromStorage.userId = finalUserIdToLoadFor;

      // Auto-detect currency if not present in loaded state
      let currencyToSet = loadedStateFromStorage.currency || defaultCurrency;
      if (!loadedStateFromStorage.currency) {
        try {
          const detectedCurrency = await getUserCurrency();
          if (detectedCurrency) {
            console.log("AppProvider: Currency auto-detected:", detectedCurrency);
            currencyToSet = detectedCurrency;
          } else {
             console.log("AppProvider: Currency auto-detection failed, using default:", defaultCurrency.code);
          }
        } catch (e) {
          console.error("AppProvider: Currency auto-detection error:", e);
        }
      }
      loadedStateFromStorage.currency = currencyToSet;
      
      // Update theme from localStorage or use default
      loadedStateFromStorage.theme = loadedStateFromStorage.theme || defaultThemeId;

      dispatch({ type: 'LOAD_STATE', payload: loadedStateFromStorage as Partial<AppState> & { userId: string | null} });
      setIsInitialDataLoaded(true);
      // isLoading will be set to true by LOAD_STATE, and then to false by LOAD_DATA_FROM_API or auth effect.
      console.log("AppProvider: Initial data processing finished. Current user ID to be set in context:", finalUserIdToLoadFor);
    };

    loadInitialData();
  }, [isInitialDataLoaded, authIsLoading, isAuthenticated, authUser]);


  // Effect for reacting to authentication changes from AuthContext
  useEffect(() => {
    if (authIsLoading || !isInitialDataLoaded) {
      // Wait for auth to resolve and initial local data to be loaded.
      return;
    }

    console.log("AppProvider: Auth state observed. AuthUser:", authUser, "IsAuthenticated:", isAuthenticated, "Current App UserID:", state.userId);

    if (isAuthenticated && authUser) {
      // User is authenticated
      if (state.userId !== authUser.id || state.isPremium !== (authUser.isPremium ?? false) || state.isLoading) {
        console.log(`AppProvider: Auth user (${authUser.id}) context update. Dispatching SET_USER_CONTEXT_IN_APP.`);
        dispatch({
          type: 'SET_USER_CONTEXT_IN_APP',
          payload: { userId: authUser.id, isPremium: authUser.isPremium ?? false }
        });
         if (typeof window !== 'undefined') {
           localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + "lastActiveUser", authUser.id);
         }
      }
    } else {
      // User is not authenticated (logged out or session expired)
      if (state.userId && !state.userId.startsWith('anon_')) { // Was previously an authenticated user
        console.log("AppProvider: User logged out or session ended. Dispatching RESET_APP_STATE_FOR_LOGOUT.");
        dispatch({ type: 'RESET_APP_STATE_FOR_LOGOUT' });
      } else if (!state.userId || state.isLoading) { // No app user ID yet or was loading
        const anonId = state.userId && state.userId.startsWith('anon_') ? state.userId : `anon_${uuidv4()}`;
        console.log(`AppProvider: No authenticated user, ensuring anonymous context. UserID: ${anonId}`);
        dispatch({ type: 'SET_USER_CONTEXT_IN_APP', payload: { userId: anonId, isPremium: false } });
        if (typeof window !== 'undefined') {
           localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + "lastActiveUser", anonId);
        }
      }
    }
  }, [isAuthenticated, authUser, authIsLoading, isInitialDataLoaded, state.userId, state.isPremium, state.isLoading]);

  // Effect for fetching API data when an authenticated userId is set AND state.isLoading is true
  useEffect(() => {
    const fetchApiDataForUser = async () => {
      if (state.userId && !state.userId.startsWith('anon_') && state.isLoading) {
        console.log(`AppProvider: Fetching API data for authenticated user ${state.userId}...`);
        try {
          const apiResponse = await fetchFromApi(`data/index.php`, { method: 'GET' }); // No userId in query, relies on session
          if (apiResponse.success && apiResponse.data) {
            const { lists = [], items = [], categories: apiCategories = [], user_preferences = {} } = apiResponse.data;
            dispatch({
              type: 'LOAD_DATA_FROM_API',
              payload: {
                lists,
                items,
                categories: apiCategories,
                userPreferences: {
                  currency: user_preferences.currency || state.currency, // Keep local/detected if API doesn't send
                  isPremium: user_preferences.is_premium !== undefined ? user_preferences.is_premium : state.isPremium,
                }
              }
            });
            console.log(`AppProvider: Successfully fetched and loaded API data for user ${state.userId}.`);
          } else {
            console.error("AppProvider: API data fetch failed for user:", state.userId, "Response:", apiResponse?.message);
            dispatch({ type: 'SET_APP_LOADING', payload: false }); // Critical: set loading false on API error
          }
        } catch (error) {
          console.error("AppProvider: Exception during API data fetch for user:", state.userId, error);
          dispatch({ type: 'SET_APP_LOADING', payload: false }); // Critical: set loading false on exception
        }
      } else if (state.isLoading) { // If still loading but not for an authenticated user (e.g., anon user)
          console.log("AppProvider: User is anonymous or no userId, setting isLoading to false (no API fetch).");
          dispatch({ type: 'SET_APP_LOADING', payload: false });
      }
    };

    if (isInitialDataLoaded) {
        fetchApiDataForUser();
    }
  }, [state.userId, state.isLoading, isInitialDataLoaded, state.currency, state.isPremium]);


  const formatCurrency = useCallback((amount: number) => {
    try {
      return new Intl.NumberFormat(undefined, { // Let browser decide locale for formatting
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
