// src/context/app-context.tsx
"use client";

import React, { createContext, useContext, useReducer, useEffect, useState, useCallback, type ReactNode } from 'react';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { getUserCurrency, type Currency } from '@/services/currency';
import { fetchFromApi } from '@/lib/api'; // Ensure this path is correct

const LOCAL_STORAGE_KEY_PREFIX = 'neonShoppingState_v4_user_'; // Updated key for user-specific storage
const ANONYMOUS_USER_ID_KEY = 'neon_anonymous_user_id';


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
  category: string; // Category ID
  checked: boolean;
  dateAdded: number; // Timestamp
}

export interface Category {
  id: string;
  name: string;
  userId: string | null; // null for default categories, user ID for custom ones
}

export interface List {
  id: string;
  userId: string; // To associate list with a user
  name: string;
  budgetLimit: number;
  defaultCategory: string; // ID of a category
}

interface AppState {
  userId: string | null; // Can be anonymous or authenticated user ID
  theme: string;
  currency: Currency;
  lists: List[];
  selectedListId: string | null;
  shoppingListItems: ShoppingListItem[];
  categories: Category[];
  isLoading: boolean;
  isPremium: boolean; // Added for premium features
}

interface AppContextProps {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  formatCurrency: (amount: number) => string;
  isLoading: boolean;
}

const defaultCurrency: Currency = { code: 'USD', symbol: '$', name: 'US Dollar' };
const defaultThemeId = 'cyberpunk-cyan';

const initialState: AppState = {
  userId: null,
  theme: defaultThemeId,
  currency: defaultCurrency,
  lists: [],
  selectedListId: null,
  shoppingListItems: [],
  categories: [...DEFAULT_CATEGORIES],
  isLoading: true,
  isPremium: false,
};

type Action =
  | { type: 'LOAD_STATE'; payload: Partial<AppState> }
  | { type: 'LOAD_API_DATA'; payload: { lists: List[]; items: ShoppingListItem[]; categories: Category[]; userPreferences: { currency?: Currency, isPremium?: boolean } } }
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
  | { type: 'ADD_CATEGORY'; payload: Category }
  | { type: 'UPDATE_CATEGORY'; payload: { id: string; name: string } }
  | { type: 'REMOVE_CATEGORY'; payload: { categoryId: string; reassignToId?: string } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_PREMIUM_STATUS'; payload: boolean }
  | { type: 'RESET_STATE_FOR_LOGOUT'};


const mergeCategories = (defaultCats: Category[], userCats: Category[]): Category[] => {
  const categoryMap = new Map<string, Category>();
  // Add default categories first, ensuring their userId is null
  defaultCats.forEach(cat => categoryMap.set(cat.id, { ...cat, userId: null }));
  // Add user-specific categories, potentially overwriting defaults if IDs match (though unlikely with UUIDs for custom)
  userCats.forEach(cat => categoryMap.set(cat.id, cat));
  return Array.from(categoryMap.values());
};


function appReducer(state: AppState, action: Action): AppState {
  let newState = { ...state };
  const currentUserIdForStorage = state.userId;

  switch (action.type) {
    case 'LOAD_STATE': // For initial local storage load (anonymous or first load for auth user)
      const { userId: loadedUserId, ...restOfPayload } = action.payload;
      newState = {
        ...initialState, // Start from a clean slate but preserve some things below
        ...restOfPayload,
        userId: loadedUserId || state.userId, // Prioritize payload's userId, then existing state, then null from initial
        isLoading: false,
      };
      newState.categories = action.payload.categories && action.payload.categories.length > 0
        ? mergeCategories(DEFAULT_CATEGORIES, action.payload.categories)
        : [...DEFAULT_CATEGORIES];
      newState.isPremium = action.payload.isPremium ?? initialState.isPremium;
      newState.currency = action.payload.currency || initialState.currency;
      newState.theme = action.payload.theme || initialState.theme;

       // Select first list if available for the current user
       if (newState.userId && newState.lists && newState.lists.length > 0) {
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

    case 'LOAD_API_DATA':
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
      // After loading API data, intelligently select a list
      if (newState.userId && newState.lists && newState.lists.length > 0) {
        const userListsFromApi = newState.lists.filter(l => l.userId === newState.userId);
        if (userListsFromApi.length > 0) {
          const currentSelectedListStillExists = userListsFromApi.some(l => l.id === state.selectedListId);
          newState.selectedListId = currentSelectedListStillExists ? state.selectedListId : userListsFromApi[0].id;
        } else {
          newState.selectedListId = null; // No lists for this user
        }
      } else if (newState.lists && newState.lists.length === 0) {
        newState.selectedListId = null; // No lists at all
      }
      break;

    case 'SET_USER_ID':
      const previousUserId = state.userId;
      newState = { ...state, userId: action.payload, isLoading: true }; // Set loading true, API/local data will be fetched
      if (action.payload === null && previousUserId) { // Logging OUT
        if (typeof window !== 'undefined') {
          localStorage.removeItem(`${LOCAL_STORAGE_KEY_PREFIX}${previousUserId}`);
        }
        // Generate new anonymous ID
        const newAnonId = `anon_${uuidv4()}`;
        localStorage.setItem(ANONYMOUS_USER_ID_KEY, newAnonId);
        newState = { // Reset to a cleaner initial state for anonymous user
          ...initialState,
          userId: newAnonId,
          isLoading: false, // Data for anon user is "loaded" (i.e., empty or from their anon storage)
          currency: state.currency, // Persist currency choice
          theme: state.theme, // Persist theme choice
        };
      } else if (action.payload && action.payload !== previousUserId) { // Logging IN or switching authenticated user
        // Clear out data that might belong to the previous user (or anonymous user)
        newState.lists = [];
        newState.shoppingListItems = [];
        newState.selectedListId = null;
        newState.categories = [...DEFAULT_CATEGORIES]; // Reset to defaults, user-specific will load from API
        newState.isPremium = false; // This will be updated by AuthContext/API call
         // Remove old anonymous ID if logging in from an anonymous state
         if (previousUserId && previousUserId.startsWith('anon_') && typeof window !== 'undefined') {
            localStorage.removeItem(ANONYMOUS_USER_ID_KEY);
            localStorage.removeItem(`${LOCAL_STORAGE_KEY_PREFIX}${previousUserId}`);
         }
      }
      break;

    case 'SET_THEME':
      newState = { ...state, theme: action.payload };
      break;
    case 'SET_CURRENCY':
      newState = { ...state, currency: action.payload };
      break;
    case 'ADD_LIST':
      if (!state.userId) return state;
      const userListsOnAdd = newState.lists.filter(l => l.userId === state.userId);
      if (!state.isPremium && userListsOnAdd.length >= FREEMIUM_LIST_LIMIT) {
         console.warn("Freemium list limit reached."); return state;
      }
      const newListWithUserId = { ...action.payload, userId: state.userId };
      newState.lists = [...newState.lists, newListWithUserId];
      if (userListsOnAdd.length === 0) { // If this is the first list for this user
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
        item.listId !== action.payload || item.userId !== state.userId
      );
      if (newState.selectedListId === action.payload) {
        const userListsAfterDelete = newState.lists.filter(l => l.userId === state.userId);
        newState.selectedListId = userListsAfterDelete.length > 0 ? userListsAfterDelete[0].id : null;
      }
      break;
    case 'SELECT_LIST':
      const listToSelect = newState.lists.find(l => l.id === action.payload);
      if (action.payload !== null && (!listToSelect || (state.userId && listToSelect.userId !== state.userId))) {
          return state; // Invalid selection or not user's list
      }
      newState.selectedListId = action.payload;
      break;
    case 'ADD_SHOPPING_ITEM':
       if (!state.userId || !action.payload.listId || action.payload.userId !== state.userId) {
         console.error("Attempted to add item with invalid listId or userId mismatch");
         return state;
       }
      newState.shoppingListItems = [...newState.shoppingListItems, action.payload];
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
        item.id === action.payload ? { ...item, checked: !item.checked, dateAdded: Date.now() } : item
      );
      break;
    case 'ADD_CATEGORY':
      if (!state.userId) { console.warn("Cannot add category: No user ID"); return state; }
      const userCustomCategories = newState.categories.filter(c => c.userId === state.userId);
      if (!state.isPremium && userCustomCategories.length >= FREEMIUM_CATEGORY_LIMIT) {
         console.warn("Freemium custom category limit reached."); return state;
      }
      newState.categories = [...newState.categories, { ...action.payload, userId: state.userId }];
      break;
    case 'UPDATE_CATEGORY':
      const categoryToUpdate = newState.categories.find(c => c.id === action.payload.id);
      if (!categoryToUpdate) return state;
      if ((categoryToUpdate.userId && categoryToUpdate.userId !== state.userId) || (categoryToUpdate.userId === null && !state.isPremium)) {
          console.warn("User not authorized to update this category."); return state;
      }
      newState.categories = newState.categories.map(cat =>
        cat.id === action.payload.id ? { ...cat, name: action.payload.name } : cat
      );
      break;
    case 'REMOVE_CATEGORY':
      const categoryToRemove = newState.categories.find(c => c.id === action.payload.categoryId);
      if (!categoryToRemove || categoryToRemove.id === 'uncategorized') return state;
      if ((categoryToRemove.userId && categoryToRemove.userId !== state.userId) || (categoryToRemove.userId === null && !state.isPremium)) {
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
    case 'SET_LOADING':
      newState = { ...state, isLoading: action.payload };
      break;
    case 'SET_PREMIUM_STATUS':
      newState = { ...state, isPremium: action.payload };
      break;
    case 'RESET_STATE_FOR_LOGOUT':
        const newAnonIdForLogout = `anon_${uuidv4()}`;
        if (typeof window !== 'undefined') {
            if (state.userId) localStorage.removeItem(`${LOCAL_STORAGE_KEY_PREFIX}${state.userId}`);
            localStorage.setItem(ANONYMOUS_USER_ID_KEY, newAnonIdForLogout);
        }
        newState = {
            ...initialState,
            userId: newAnonIdForLogout,
            isLoading: false, // Reset loading state for anon user
            currency: state.currency, // Keep current UI preferences
            theme: state.theme,
        };
        break;
    default:
      newState = state;
  }

  // Save to localStorage for the current user (authenticated or anonymous)
  if (newState.userId && typeof window !== 'undefined' && action.type !== 'SET_LOADING' && action.type !== 'LOAD_STATE' && action.type !== 'LOAD_API_DATA') {
    try {
      const stateToSave = { ...newState, isLoading: undefined }; // Don't save isLoading flag
      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${newState.userId}`, JSON.stringify(stateToSave));
    } catch (error) {
      console.error("Failed to save state to localStorage for user:", newState.userId, error);
    }
  }
  return newState;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [isInitialDataLoaded, setIsInitialDataLoaded] = useState(false); // Tracks if initial local/anon data is loaded

  // Effect for loading initial local state (anonymous or from localStorage for an auth user not yet session-verified)
  useEffect(() => {
    const loadInitialLocalData = async () => {
      console.log("AppProvider: Attempting to load initial local data. Current state.userId:", state.userId);
      dispatch({ type: 'SET_LOADING', payload: true });

      let currentUserIdToLoadFor = state.userId; // Use userId from AuthContext if already set

      if (!currentUserIdToLoadFor) { // If AuthContext hasn't set a user ID yet (e.g., initial app load)
        currentUserIdToLoadFor = localStorage.getItem(ANONYMOUS_USER_ID_KEY);
        if (!currentUserIdToLoadFor) {
          currentUserIdToLoadFor = `anon_${uuidv4()}`;
          localStorage.setItem(ANONYMOUS_USER_ID_KEY, currentUserIdToLoadFor);
        }
        console.log("AppProvider: Using/generating anonymous ID:", currentUserIdToLoadFor);
      } else {
        console.log("AppProvider: User ID already present in state (likely from AuthContext):", currentUserIdToLoadFor);
      }

      let loadedStateFromStorage: Partial<AppState> = { userId: currentUserIdToLoadFor };
      const savedStateRaw = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${currentUserIdToLoadFor}`);
      if (savedStateRaw) {
        try {
          const parsedState = JSON.parse(savedStateRaw) as Omit<AppState, 'isLoading'>;
          loadedStateFromStorage = { ...parsedState, userId: currentUserIdToLoadFor };
           console.log("AppProvider: Loaded state from localStorage for user:", currentUserIdToLoadFor);
        } catch (e) {
          console.error(`Failed to parse state for user ${currentUserIdToLoadFor}:`, e);
        }
      } else {
         console.log("AppProvider: No saved state in localStorage for user:", currentUserIdToLoadFor);
      }
      
      if (!loadedStateFromStorage.currency) {
        try {
          const detectedCurrency = await getUserCurrency();
          loadedStateFromStorage.currency = detectedCurrency || defaultCurrency;
          if(detectedCurrency) console.log("AppProvider: Currency auto-detected:", detectedCurrency);
        } catch (e) {
          console.error("AppProvider: Currency auto-detection error:", e);
          loadedStateFromStorage.currency = defaultCurrency;
        }
      }
      
      dispatch({ type: 'LOAD_STATE', payload: loadedStateFromStorage });
      setIsInitialDataLoaded(true);
      console.log("AppProvider: Initial local data processing finished. User ID in context now:", currentUserIdToLoadFor);
    };
    
    if (!isInitialDataLoaded) { // Only run once for the very first load of the app session
        loadInitialLocalData();
    }
  }, [isInitialDataLoaded, state.userId]); // state.userId is key to re-evaluate if AuthContext provides it early

  // Effect for fetching API data for AUTHENTICATED (non-anonymous) users
  useEffect(() => {
    const fetchApiDataForUser = async () => {
      if (state.userId && !state.userId.startsWith('anon_') && isInitialDataLoaded) {
        console.log(`AppContext: Authenticated user ${state.userId} detected, attempting to fetch API data...`);
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
          // Ensure user ID is passed or handled by fetchFromApi (e.g., via headers from AuthContext)
          const apiResponse = await fetchFromApi(`data/index.php`, { method: 'GET' });
          
          if (apiResponse.success && apiResponse.data) {
            const { lists = [], items = [], categories: apiCategories = [], user_preferences = {} } = apiResponse.data;
            dispatch({
              type: 'LOAD_API_DATA',
              payload: {
                lists,
                items,
                categories: apiCategories,
                userPreferences: {
                  currency: user_preferences.currency,
                  isPremium: user_preferences.is_premium,
                }
              }
            });
             console.log(`AppContext: Successfully fetched API data for user ${state.userId}`);
          } else {
            console.error("AppContext: Failed to fetch or process API data for authenticated user:", apiResponse.message);
            dispatch({ type: 'SET_LOADING', payload: false }); // Critical: ensure loading stops on API error
          }
        } catch (error) {
          console.error("AppContext: Error during API data fetch for authenticated user:", error);
          dispatch({ type: 'SET_LOADING', payload: false }); // Critical: ensure loading stops on network/other error
        } finally {
            // Ensure isLoading is false after attempt, moved SET_LOADING to LOAD_API_DATA and catch for more specific control.
            // If the fetchApiDataForUser logic itself needs a final isLoading=false, it can be added here,
            // but usually handled by success/error dispatches.
            // dispatch({ type: 'SET_LOADING', payload: false }); // This might be too broad if success/error already handle it.
        }
      } else if ((state.userId && state.userId.startsWith('anon_') || !state.userId) && isInitialDataLoaded && state.isLoading) {
        // For anonymous users, after initial load, ensure loading is false if it was somehow still true
        console.log("AppContext: Anonymous/No user, initial data loaded. Ensuring isLoading is false.");
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    if (isInitialDataLoaded) { // Only try to fetch API data once initial local/anon setup is done
        fetchApiDataForUser();
    }
  }, [state.userId, isInitialDataLoaded, dispatch]);


  const formatCurrency = useCallback((amount: number) => {
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: state.currency.code,
      }).format(amount);
    } catch (error) {
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
