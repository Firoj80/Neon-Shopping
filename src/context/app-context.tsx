// src/context/app-context.tsx
"use client";

import React, { createContext, useContext, useReducer, useEffect, useState, useCallback, type ReactNode } from 'react';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { getUserCurrency, type Currency } from '@/services/currency';
import { fetchFromApi } from '@/lib/api'; // Ensure this path is correct

const LOCAL_STORAGE_KEY_PREFIX = 'neonShoppingState_v4_user_';
const ANONYMOUS_USER_ID_KEY = 'neon_anonymous_user_id_v2';


export const FREEMIUM_LIST_LIMIT = 3;
export const FREEMIUM_CATEGORY_LIMIT = 5; // Max custom categories for freemium

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'uncategorized', name: 'Uncategorized', userId: null }, // Global default
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
  userId: string; // Ensure this is always present and correct
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
  userId: string | null; // null for default/global categories, string for user-created
}

export interface List {
  id: string;
  userId: string; // Ensure this is always present and correct
  name: string;
  budgetLimit: number;
  defaultCategory: string; // ID of a category
}

export interface UserPreferences {
    currency: Currency;
    isPremium: boolean;
}

interface AppState {
  userId: string | null; // Can be null initially, or anonymous ID, or authenticated ID
  theme: string; // Keep theme as it was, not removing yet
  currency: Currency;
  lists: List[];
  selectedListId: string | null;
  shoppingListItems: ShoppingListItem[];
  categories: Category[];
  isLoading: boolean; // Tracks loading of app-specific data (lists, items, categories)
  isPremium: boolean; // User's premium status
}

interface AppContextProps {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  formatCurrency: (amount: number) => string;
  isLoading: boolean; // AppContext's own loading state for its data
}

const defaultCurrency: Currency = { code: 'USD', symbol: '$', name: 'US Dollar' };
const defaultThemeId = 'cyberpunk-cyan';


const initialState: AppState = {
  userId: null, // Start as null, will be set by AuthContext or anonymous logic
  theme: defaultThemeId,
  currency: defaultCurrency,
  lists: [],
  selectedListId: null,
  shoppingListItems: [],
  categories: [...DEFAULT_CATEGORIES],
  isLoading: true, // Initially true, waiting for user ID and data
  isPremium: false,
};

type Action =
  | { type: 'LOAD_STATE'; payload: Partial<AppState> & { userId: string | null } }
  | { type: 'LOAD_API_DATA'; payload: { lists: List[]; items: ShoppingListItem[]; categories: Category[]; userPreferences: Partial<UserPreferences> } }
  | { type: 'SET_USER_ID'; payload: string | null }
  | { type: 'SET_THEME'; payload: string }
  | { type: 'SET_CURRENCY'; payload: Currency }
  | { type: 'ADD_LIST'; payload: List }
  | { type: 'UPDATE_LIST'; payload: List }
  | { type: 'DELETE_LIST'; payload: string }
  | { type: 'SELECT_LIST'; payload: string | null }
  | { type: 'ADD_SHOPPING_ITEM'; payload: ShoppingListItem }
  | { type: 'UPDATE_SHOPPING_ITEM'; payload: ShoppingListItem }
  | { type: 'REMOVE_SHOPPING_ITEM'; payload: string }
  | { type: 'TOGGLE_SHOPPING_ITEM'; payload: string }
  | { type: 'ADD_CATEGORY'; payload: Pick<Category, 'name'> }
  | { type: 'UPDATE_CATEGORY'; payload: { id: string; name: string } }
  | { type: 'REMOVE_CATEGORY'; payload: { categoryId: string; reassignToId?: string } }
  | { type: 'SET_APP_LOADING'; payload: boolean }
  | { type: 'SET_PREMIUM_STATUS'; payload: boolean }
  | { type: 'LOAD_USER_PREFERENCES'; payload: Partial<UserPreferences> }
  | { type: 'RESET_STATE_FOR_LOGOUT'};


const mergeCategories = (defaultCats: Category[], userCats: Category[]): Category[] => {
  const categoryMap = new Map<string, Category>();
  defaultCats.forEach(cat => categoryMap.set(cat.id, { ...cat, userId: null })); // Ensure default cats have null userId
  userCats.forEach(cat => categoryMap.set(cat.id, cat)); // User cats will have their userId
  return Array.from(categoryMap.values());
};


function appReducer(state: AppState, action: Action): AppState {
  let newState = { ...state };

  switch (action.type) {
    case 'LOAD_STATE': {
      const { userId: loadedUserId, ...restOfPayload } = action.payload;
      newState = {
        ...initialState, // Start from a clean slate to ensure no old data lingers
        ...restOfPayload,
        userId: loadedUserId, // This is crucial for associating data
        isLoading: !!loadedUserId && !loadedUserId.startsWith('anon_'), // True if auth user, false if anon or null
      };
      newState.categories = (restOfPayload.categories && restOfPayload.categories.length > 0)
        ? mergeCategories(DEFAULT_CATEGORIES, restOfPayload.categories.filter(c => c.userId === loadedUserId || c.userId === null))
        : [...DEFAULT_CATEGORIES];
      
      newState.isPremium = restOfPayload.isPremium ?? initialState.isPremium;
      newState.currency = restOfPayload.currency || initialState.currency;
      newState.theme = restOfPayload.theme || initialState.theme;
      
      // Auto-select first list if available for the current user
      if (newState.userId && newState.lists && Array.isArray(newState.lists)) {
        const userLists = newState.lists.filter(l => l.userId === newState.userId);
        if (userLists.length > 0 && !userLists.some(l => l.id === newState.selectedListId)) {
            newState.selectedListId = userLists[0].id;
        } else if (userLists.length === 0) {
            newState.selectedListId = null;
        }
      } else {
        newState.selectedListId = null;
      }
      break;
    }
    case 'LOAD_API_DATA': {
      const { lists, items, categories: apiCategories, userPreferences } = action.payload;
      newState = {
        ...state,
        lists: lists || state.lists,
        shoppingListItems: items || state.shoppingListItems,
        categories: apiCategories ? mergeCategories(DEFAULT_CATEGORIES, apiCategories) : state.categories,
        currency: userPreferences.currency || state.currency,
        isPremium: userPreferences.isPremium !== undefined ? userPreferences.isPremium : state.isPremium,
        theme: userPreferences.theme || state.theme,
        isLoading: false, // API data loaded
      };
      // After loading API data, intelligently select a list for the current user
      if (newState.userId && newState.lists && Array.isArray(newState.lists)) {
        const userListsFromApi = newState.lists; // API should already filter by user
        if (userListsFromApi.length > 0) {
          const currentSelectedListStillExists = userListsFromApi.some(l => l.id === state.selectedListId);
          newState.selectedListId = currentSelectedListStillExists ? state.selectedListId : userListsFromApi[0].id;
        } else {
          newState.selectedListId = null; // No lists for this user from API
        }
      } else if (newState.lists && Array.isArray(newState.lists) && newState.lists.length === 0) {
        newState.selectedListId = null;
      }
      break;
    }
    case 'SET_USER_ID': {
      const previousUserId = state.userId;
      const newUserId = action.payload;
      newState = { ...state, userId: newUserId, isLoading: true }; // Assume loading on user change

      if (newUserId === null && previousUserId) { // Logging OUT
         // State reset is now primarily handled by RESET_STATE_FOR_LOGOUT, called by AuthContext
      } else if (newUserId && newUserId !== previousUserId) { // Logging IN or switching
        newState.lists = [];
        newState.shoppingListItems = [];
        newState.selectedListId = null;
        newState.categories = [...DEFAULT_CATEGORIES]; // Reset to defaults, API will supplement
        newState.isPremium = false; // Reset premium, API will update
        // Local storage for old anon ID is cleared by AuthContext if it generated it.
        // Local storage for new auth user will be populated by API fetch or subsequent actions.
      }
      break;
    }
    case 'LOAD_USER_PREFERENCES': // This is typically called after API load
        newState = {
            ...state,
            currency: action.payload.currency || state.currency,
            isPremium: action.payload.isPremium !== undefined ? action.payload.isPremium : state.isPremium,
            theme: action.payload.theme || state.theme,
        };
        break;
    case 'SET_THEME':
      newState = { ...state, theme: action.payload };
      break;
    case 'SET_CURRENCY':
      newState = { ...state, currency: action.payload };
      // Potentially save to backend API if user is authenticated
      if (state.userId && !state.userId.startsWith('anon_')) {
         fetchFromApi('user/preferences.php', { method: 'POST', body: JSON.stringify({ currencyCode: action.payload.code })})
           .catch(err => console.error("Failed to save currency preference to backend:", err));
      }
      break;
    case 'ADD_LIST': {
      if (!state.userId) return state;
      const userListsOnAdd = newState.lists.filter(l => l.userId === state.userId);
      if (!state.isPremium && userListsOnAdd.length >= FREEMIUM_LIST_LIMIT) {
         console.warn("Freemium list limit reached."); return state; // Or show toast
      }
      const newListWithUserId = { ...action.payload, userId: state.userId };
      newState.lists = [...newState.lists, newListWithUserId];
      // Auto-select the new list if it's the first one for this user or if no list was selected
      if (userListsOnAdd.length === 0 || newState.selectedListId === null) {
        newState.selectedListId = newListWithUserId.id;
      }
      break;
    }
    case 'UPDATE_LIST': {
      if (!state.userId || action.payload.userId !== state.userId) return state;
      newState.lists = newState.lists.map(list =>
        list.id === action.payload.id ? { ...action.payload, userId: state.userId } : list
      );
      break;
    }
    case 'DELETE_LIST': {
      const listToDelete = newState.lists.find(l => l.id === action.payload);
      if (!listToDelete || !state.userId || listToDelete.userId !== state.userId) return state;
      
      newState.lists = newState.lists.filter(list => list.id !== action.payload);
      newState.shoppingListItems = newState.shoppingListItems.filter(item =>
        item.listId !== action.payload || item.userId !== state.userId
      );
      if (newState.selectedListId === action.payload) {
        const userListsAfterDelete = newState.lists.filter(l => l.userId === state.userId);
        newState.selectedListId = userListsAfterDelete.length > 0 ? userListsAfterDelete[0].id : null;
      }
      break;
    }
    case 'SELECT_LIST': {
      // Ensure the list being selected belongs to the current user if authenticated
      const listToSelect = newState.lists.find(l => l.id === action.payload);
      if (action.payload !== null && (!listToSelect || (state.userId && listToSelect.userId !== state.userId))) {
          console.warn("Attempted to select a list not belonging to the current user or not found.");
          return state; // Do not change selectedListId
      }
      newState.selectedListId = action.payload;
      break;
    }
    case 'ADD_SHOPPING_ITEM': {
       if (!state.userId || !action.payload.listId || action.payload.userId !== state.userId) {
         console.error("Attempted to add item with invalid listId or userId mismatch for user:", state.userId, "Item data:", action.payload);
         return state;
       }
      newState.shoppingListItems = [...newState.shoppingListItems, action.payload];
      break;
    }
    case 'UPDATE_SHOPPING_ITEM': {
      if (!state.userId || action.payload.userId !== state.userId) return state;
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
        item.id === action.payload ? { ...item, checked: !item.checked, dateAdded: Date.now() } : item
      );
      break;
    }
    case 'ADD_CATEGORY': {
      if (!state.userId) { console.warn("Cannot add category: No user ID"); return state; }
      const userCustomCategories = newState.categories.filter(c => c.userId === state.userId);
      if (!state.isPremium && userCustomCategories.length >= FREEMIUM_CATEGORY_LIMIT) {
         console.warn("Freemium custom category limit reached."); return state; // Or show toast
      }
      const newCategory: Category = { id: `cat-${uuidv4()}`, name: action.payload.name, userId: state.userId };
      newState.categories = [...newState.categories, newCategory];
      break;
    }
    case 'UPDATE_CATEGORY': {
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
    }
    case 'REMOVE_CATEGORY': {
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
          item.category === action.payload.categoryId && item.userId === state.userId ? { ...item, category: reassignId } : item
        );
        newState.lists = newState.lists.map(list =>
          list.defaultCategory === action.payload.categoryId && list.userId === state.userId ? { ...list, defaultCategory: reassignId } : list
        );
      }
      break;
    }
    case 'SET_APP_LOADING':
      newState = { ...state, isLoading: action.payload };
      break;
    case 'SET_PREMIUM_STATUS':
      newState = { ...state, isPremium: action.payload };
      break;
    case 'RESET_STATE_FOR_LOGOUT': {
        const newAnonIdForLogout = `anon_${uuidv4()}`;
        if (typeof window !== 'undefined') {
            if (state.userId) localStorage.removeItem(`${LOCAL_STORAGE_KEY_PREFIX}${state.userId}`);
            localStorage.setItem(ANONYMOUS_USER_ID_KEY, newAnonIdForLogout);
        }
        newState = {
            ...initialState,
            userId: newAnonIdForLogout,
            isLoading: false, // Anon user doesn't initially fetch API data
            currency: state.currency, // Keep current currency and theme
            theme: state.theme,
        };
        break;
      }
    default:
      newState = state;
  }

  // Persist state to localStorage for the current user
  if (newState.userId && typeof window !== 'undefined' && action.type !== 'SET_APP_LOADING' && action.type !== 'LOAD_STATE') {
    try {
      // Avoid saving isLoading to localStorage
      const { isLoading: _omittedIsLoading, ...stateToSave } = newState;
      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${newState.userId}`, JSON.stringify(stateToSave));
      console.log(`AppContext: Saved state to localStorage for user: ${newState.userId}`);
    } catch (error) {
      console.error("Failed to save state to localStorage for user:", newState.userId, error);
    }
  }
  return newState;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [isInitialDataLoaded, setIsInitialDataLoaded] = useState(false); // Tracks if the first load has happened


  // Effect for initial data loading (local storage, anonymous ID, or API for auth user)
  useEffect(() => {
    const loadInitialData = async () => {
      console.log("AppProvider: Starting initial data load. Current AppContext userId:", state.userId);
      dispatch({ type: 'SET_APP_LOADING', payload: true });

      let userIdToLoadFor = state.userId; // Use current userId from state (could be set by AuthContext)

      if (!userIdToLoadFor) { // If AuthContext hasn't set a user ID yet (e.g., still loading auth)
        userIdToLoadFor = localStorage.getItem(ANONYMOUS_USER_ID_KEY);
        if (!userIdToLoadFor) {
          userIdToLoadFor = `anon_${uuidv4()}`;
          localStorage.setItem(ANONYMOUS_USER_ID_KEY, userIdToLoadFor);
        }
        console.log("AppProvider: No authenticated user from AuthContext yet, using/generating anonymous ID:", userIdToLoadFor);
      }

      let loadedStateFromStorage: Partial<AppState> = {};
      const savedStateRaw = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${userIdToLoadFor}`);
      if (savedStateRaw) {
        try {
          const parsedState = JSON.parse(savedStateRaw) as Omit<AppState, 'isLoading'>;
          loadedStateFromStorage = { ...parsedState };
          console.log(`AppProvider: Loaded state from localStorage for user: ${userIdToLoadFor}`);
        } catch (e) {
          console.error(`Failed to parse state from localStorage for user ${userIdToLoadFor}, resetting to defaults for this user. Error:`, e);
          // If parsing fails, clear potentially corrupted data for this user
          localStorage.removeItem(`${LOCAL_STORAGE_KEY_PREFIX}${userIdToLoadFor}`);
        }
      } else {
         console.log(`AppProvider: No saved state in localStorage for user: ${userIdToLoadFor}`);
      }
      
      // Initialize currency: use stored, then auto-detect, then default
      let finalCurrency = loadedStateFromStorage.currency || defaultCurrency;
      if (!loadedStateFromStorage.currency) { // Only attempt detection if not found in storage
        try {
          const detectedCurrency = await getUserCurrency();
          if (detectedCurrency) {
            finalCurrency = detectedCurrency;
            console.log("AppProvider: Currency auto-detected:", detectedCurrency);
          } else {
            console.log("AppProvider: Currency auto-detection failed, using default.");
          }
        } catch (e) {
          console.error("AppProvider: Currency auto-detection error:", e);
        }
      }
      
      // Dispatch LOAD_STATE with the determined userId and any loaded data
      // isLoading inside LOAD_STATE will be set based on whether userIdToLoadFor is authenticated
      dispatch({ type: 'LOAD_STATE', payload: { ...loadedStateFromStorage, userId: userIdToLoadFor, currency: finalCurrency } });
      setIsInitialDataLoaded(true);
      console.log("AppProvider: Initial data processing finished. User ID dispatched to LOAD_STATE:", userIdToLoadFor);
    };
    
    // This effect should run once when the AppProvider mounts, or if the state.userId changes
    // from null to something (e.g. AuthContext provides an ID after initial AppContext load)
    if (!isInitialDataLoaded || (state.userId && !state.userId.startsWith('anon_') && !state.isLoading && state.lists.length === 0 && state.shoppingListItems.length === 0) ) {
        // The condition "state.lists.length === 0 && state.shoppingListItems.length === 0" is to refetch if API data was missed
        loadInitialData();
    }

  }, [state.userId, isInitialDataLoaded]); // React to userId changes from AuthContext

  // Effect for fetching API data when an authenticated user ID is set and initial local load is done
  useEffect(() => {
    const fetchApiDataForUser = async () => {
      // Only fetch if we have an authenticated user ID, initial local load is done, and AppContext is currently "loading" (expecting API data)
      if (state.userId && !state.userId.startsWith('anon_') && isInitialDataLoaded && state.isLoading) {
        console.log(`AppContext: Authenticated user ${state.userId} identified. Fetching API data...`);
        // SET_APP_LOADING true is already set by LOAD_STATE for authenticated users
        try {
          const apiResponse = await fetchFromApi(`data/index.php`, { method: 'GET' }); // No user_id in query, relies on session cookie
          if (apiResponse.success && apiResponse.data) {
            const { lists = [], items = [], categories: apiCategories = [], user_preferences = {} } = apiResponse.data;
            dispatch({
              type: 'LOAD_API_DATA',
              payload: {
                lists,
                items,
                categories: apiCategories,
                userPreferences: {
                  currency: user_preferences.currency || state.currency, // Prefer API currency, fallback to current
                  isPremium: user_preferences.is_premium !== undefined ? user_preferences.is_premium : state.isPremium, // Prefer API premium
                }
              }
            });
             console.log(`AppContext: Successfully fetched and loaded API data for user ${state.userId}`);
          } else {
            console.error("AppContext: API data fetch failed or data missing for user:", state.userId, "Response:", apiResponse?.message);
            dispatch({ type: 'SET_APP_LOADING', payload: false }); // Set loading false on API error
          }
        } catch (error) {
          console.error("AppContext: Exception during API data fetch for user:", state.userId, error);
          dispatch({ type: 'SET_APP_LOADING', payload: false }); // Set loading false on exception
        }
      } else if (state.userId && state.userId.startsWith('anon_') && isInitialDataLoaded && state.isLoading) {
          // This ensures that for anonymous users, after LOAD_STATE, isLoading becomes false.
          console.log("AppContext: Anonymous user, setting isLoading to false post initial load.")
          dispatch({ type: 'SET_APP_LOADING', payload: false });
      }
    };

    fetchApiDataForUser();
  }, [state.userId, isInitialDataLoaded, state.isLoading, dispatch, state.currency, state.isPremium]);


  const formatCurrency = useCallback((amount: number) => {
    try {
      return new Intl.NumberFormat(undefined, { // Use browser's default locale
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
