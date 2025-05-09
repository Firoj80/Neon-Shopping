// src/context/app-context.tsx
"use client";

import React, { createContext, useContext, useReducer, useEffect, useState, useCallback, type ReactNode } from 'react';
import { format } from 'date-fns'; // Removed startOfDay, isSameDay as they are not used here
import { v4 as uuidv4 } from 'uuid';
import { getUserCurrency, type Currency } from '@/services/currency';
import { fetchFromApi } from '@/lib/api';

const LOCAL_STORAGE_KEY_PREFIX = 'neonShoppingState_v3_user_'; // Prefix for user-specific storage
const ANONYMOUS_USER_ID_KEY = 'anonymous_user_id_neon_shopping';

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

export interface ShoppingListItem {
  id: string;
  listId: string;
  userId: string;
  name: string;
  quantity: number;
  price: number;
  category: string;
  checked: boolean;
  dateAdded: number;
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

export interface BudgetItem { // Added for clarity, assuming this was intended
    limit: number;
    spent: number;
    lastSetDate: string | null; // YYYY-MM-DD
    dailySpent: { [date: string]: number }; // Tracks daily spending for reset
}


interface AppState {
  userId: string | null;
  theme: string;
  currency: Currency;
  lists: List[];
  selectedListId: string | null;
  shoppingListItems: ShoppingListItem[];
  categories: Category[];
  isLoading: boolean;
  isPremium: boolean;
  budget: BudgetItem; // Added budget to app state
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
  budget: { limit: 0, spent: 0, lastSetDate: null, dailySpent: {} }, // Initialize budget
};

type Action =
  | { type: 'LOAD_STATE_FROM_LOCALSTORAGE'; payload: Partial<AppState> }
  | { type: 'LOAD_STATE_FROM_API'; payload: Partial<AppState> }
  | { type: 'SET_USER_ID'; payload: string | null }
  | { type: 'SET_THEME'; payload: string }
  | { type: 'SET_CURRENCY'; payload: Currency }
  | { type: 'ADD_LIST'; payload: List }
  | { type: 'UPDATE_LIST'; payload: List }
  | { type: 'DELETE_LIST'; payload: string }
  | { type: 'SELECT_LIST'; payload: string | null }
  | { type: 'ADD_SHOPPING_ITEM'; payload: ShoppingListItem } // Changed: Expect full ShoppingListItem
  | { type: 'UPDATE_SHOPPING_ITEM'; payload: ShoppingListItem }
  | { type: 'REMOVE_SHOPPING_ITEM'; payload: string }
  | { type: 'TOGGLE_SHOPPING_ITEM'; payload: string }
  | { type: 'ADD_CATEGORY'; payload: Category } // Changed: Expect full Category object
  | { type: 'UPDATE_CATEGORY'; payload: { id: string; name: string } }
  | { type: 'REMOVE_CATEGORY'; payload: { categoryId: string; reassignToId?: string } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_PREMIUM_STATUS'; payload: boolean }
  | { type: 'UPDATE_BUDGET'; payload: Partial<BudgetItem> }
  | { type: 'RESET_DAILY_SPENT'; payload: { today: string } }
  | { type: 'RESET_STATE_FOR_LOGOUT' };


function appReducer(state: AppState, action: Action): AppState {
  let newState = { ...state };
  const currentUserId = newState.userId; // userId for localStorage key

  switch (action.type) {
    case 'LOAD_STATE_FROM_LOCALSTORAGE':
      newState = { ...initialState, ...action.payload, isLoading: false }; // Start from initial, then apply payload
      // Ensure critical parts are initialized if not in payload
      newState.userId = action.payload.userId || state.userId || null; // Prioritize payload's userId, then current state, then null
      newState.currency = action.payload.currency || defaultCurrency;
      newState.theme = action.payload.theme || defaultThemeId;
      newState.categories = action.payload.categories && action.payload.categories.length > 0 ? mergeCategories(DEFAULT_CATEGORIES, action.payload.categories) : [...DEFAULT_CATEGORIES];
      newState.lists = action.payload.lists || [];
      newState.shoppingListItems = action.payload.shoppingListItems || [];
      newState.selectedListId = action.payload.selectedListId || null;
      newState.isPremium = action.payload.isPremium || false;
      newState.budget = action.payload.budget || { limit: 0, spent: 0, lastSetDate: null, dailySpent: {} };

      // Smartly set selectedListId if needed
      if (newState.userId && newState.lists.length > 0) {
        const userLists = newState.lists.filter(l => l.userId === newState.userId);
        if (userLists.length > 0) {
            if (!userLists.find(l => l.id === newState.selectedListId)) {
                newState.selectedListId = userLists[0].id;
            }
        } else {
            newState.selectedListId = null;
        }
      } else {
        newState.selectedListId = null;
      }
      break;

    case 'LOAD_STATE_FROM_API':
      newState = { ...state, ...action.payload, isLoading: false };
      newState.categories = action.payload.categories && action.payload.categories.length > 0 ? mergeCategories(DEFAULT_CATEGORIES, action.payload.categories) : state.categories; // Merge, keep existing if API is empty
      newState.isPremium = action.payload.isPremium !== undefined ? action.payload.isPremium : state.isPremium;
      newState.currency = action.payload.currency || state.currency;

      // Smartly set selectedListId after API load
      if (newState.userId && newState.lists && newState.lists.length > 0) {
        const userListsFromApi = newState.lists.filter(l => l.userId === newState.userId);
        if (userListsFromApi.length > 0) {
          const currentSelectedListStillExists = userListsFromApi.some(l => l.id === state.selectedListId);
          newState.selectedListId = currentSelectedListStillExists ? state.selectedListId : userListsFromApi[0].id;
        } else {
          newState.selectedListId = null; // No lists for this user from API
        }
      } else if (newState.lists && newState.lists.length === 0) {
         newState.selectedListId = null; // No lists at all from API
      }
      // If lists array is undefined in payload, keep current lists
      newState.lists = action.payload.lists !== undefined ? action.payload.lists : state.lists;
      newState.shoppingListItems = action.payload.shoppingListItems !== undefined ? action.payload.shoppingListItems : state.shoppingListItems;

      break;

    case 'SET_USER_ID':
      const previousUserId = state.userId;
      newState = { ...state, userId: action.payload };
      if (action.payload === null) { // Logging OUT
        console.log("AppReducer: User logging out. Resetting state.");
        newState.lists = [];
        newState.shoppingListItems = [];
        newState.selectedListId = null;
        newState.categories = [...DEFAULT_CATEGORIES];
        newState.isPremium = false;
        newState.budget = { limit: 0, spent: 0, lastSetDate: null, dailySpent: {} };
        if (previousUserId && typeof window !== 'undefined') {
          localStorage.removeItem(`${LOCAL_STORAGE_KEY_PREFIX}${previousUserId}`);
        }
      } else if (action.payload !== previousUserId) { // Logging IN as a NEW or DIFFERENT user
        console.log(`AppReducer: User changed from ${previousUserId || 'anon/none'} to ${action.payload}. Clearing user-specific data for new user.`);
        newState.lists = [];
        newState.shoppingListItems = [];
        newState.selectedListId = null;
        newState.categories = [...DEFAULT_CATEGORIES];
        newState.isPremium = false;
        newState.budget = { limit: 0, spent: 0, lastSetDate: null, dailySpent: {} };
        // Data for the new user will be fetched by AppProvider's useEffect
      }
      break;

    case 'SET_THEME':
      newState = { ...state, theme: action.payload };
      break;
    case 'SET_CURRENCY':
      newState = { ...state, currency: action.payload };
      break;
    case 'ADD_LIST':
      if (!newState.userId) return state;
      const userListsOnAdd = newState.lists.filter(l => l.userId === newState.userId);
      if (!newState.isPremium && userListsOnAdd.length >= FREEMIUM_LIST_LIMIT) {
        console.warn("Freemium list limit reached."); return state;
      }
      newState.lists = [...newState.lists, action.payload];
      if (userListsOnAdd.length === 0) { // If this is the first list for the user
        newState.selectedListId = action.payload.id;
      }
      break;
    case 'UPDATE_LIST':
      if (!newState.userId || action.payload.userId !== newState.userId) return state;
      newState.lists = newState.lists.map(list => list.id === action.payload.id ? action.payload : list);
      break;
    case 'DELETE_LIST':
      const listToDelete = newState.lists.find(l => l.id === action.payload);
      if (!listToDelete || !newState.userId || listToDelete.userId !== newState.userId) return state;
      newState.lists = newState.lists.filter(list => list.id !== action.payload);
      newState.shoppingListItems = newState.shoppingListItems.filter(item => item.listId !== action.payload || item.userId !== newState.userId);
      if (newState.selectedListId === action.payload) {
        const userListsAfterDelete = newState.lists.filter(l => l.userId === newState.userId);
        newState.selectedListId = userListsAfterDelete.length > 0 ? userListsAfterDelete[0].id : null;
      }
      break;
    case 'SELECT_LIST':
      const listToSelect = newState.lists.find(l => l.id === action.payload);
      if (action.payload !== null && (!listToSelect || (newState.userId && listToSelect.userId !== newState.userId))) {
        return state; // Do not select if list doesn't exist or doesn't belong to current user
      }
      newState.selectedListId = action.payload;
      break;
    case 'ADD_SHOPPING_ITEM':
      if (!action.payload.listId || !action.payload.userId) {
        console.error("Attempted to add item without listId or userId being set in payload.");
        return state;
      }
      newState.shoppingListItems = [...newState.shoppingListItems, action.payload];
      break;
    case 'UPDATE_SHOPPING_ITEM':
      if (!newState.userId || action.payload.userId !== newState.userId) return state;
      newState.shoppingListItems = newState.shoppingListItems.map(item => item.id === action.payload.id ? action.payload : item);
      break;
    case 'REMOVE_SHOPPING_ITEM':
      const itemToRemove = newState.shoppingListItems.find(item => item.id === action.payload);
      if (!itemToRemove || !newState.userId || itemToRemove.userId !== newState.userId) return state;
      newState.shoppingListItems = newState.shoppingListItems.filter(item => item.id !== action.payload);
      break;
    case 'TOGGLE_SHOPPING_ITEM':
      const itemToToggle = newState.shoppingListItems.find(item => item.id === action.payload);
      if (!itemToToggle || !newState.userId || itemToToggle.userId !== newState.userId) return state;
      newState.shoppingListItems = newState.shoppingListItems.map(item =>
        item.id === action.payload ? { ...item, checked: !item.checked, dateAdded: Date.now() } : item
      );
      break;
    case 'ADD_CATEGORY':
      if (!newState.userId) return state;
      const userCustomCategories = newState.categories.filter(c => c.userId === newState.userId);
      if (!newState.isPremium && userCustomCategories.length >= FREEMIUM_CATEGORY_LIMIT) {
         console.warn("Freemium custom category limit reached."); return state;
      }
      newState.categories = [...newState.categories, action.payload];
      break;
    case 'UPDATE_CATEGORY':
      const categoryToUpdate = newState.categories.find(c => c.id === action.payload.id);
      if (!categoryToUpdate) return state;
      if (categoryToUpdate.userId === null && !newState.isPremium) { // Freemium cannot edit defaults
          console.warn("Freemium users cannot edit default categories."); return state;
      }
      if (categoryToUpdate.userId && categoryToUpdate.userId !== newState.userId) return state; // Not owner
      newState.categories = newState.categories.map(cat => cat.id === action.payload.id ? { ...cat, name: action.payload.name } : cat);
      break;
    case 'REMOVE_CATEGORY':
      const categoryToRemove = newState.categories.find(c => c.id === action.payload.categoryId);
      if (!categoryToRemove || categoryToRemove.id === 'uncategorized') return state;
      if (categoryToRemove.userId === null && !newState.isPremium) { // Freemium cannot delete defaults
          console.warn("Freemium users cannot delete default categories."); return state;
      }
      if (categoryToRemove.userId && categoryToRemove.userId !== newState.userId) return state; // Not owner
      newState.categories = newState.categories.filter(cat => cat.id !== action.payload.categoryId);
      if (newState.userId) {
        const reassignId = action.payload.reassignToId || 'uncategorized';
        newState.shoppingListItems = newState.shoppingListItems.map(item =>
          item.category === action.payload.categoryId && item.userId === newState.userId ? { ...item, category: reassignId } : item
        );
        newState.lists = newState.lists.map(list =>
          list.defaultCategory === action.payload.categoryId && list.userId === newState.userId ? { ...list, defaultCategory: reassignId } : list
        );
      }
      break;
    case 'SET_LOADING':
      newState = { ...state, isLoading: action.payload };
      break;
    case 'SET_PREMIUM_STATUS':
      newState = { ...state, isPremium: action.payload };
      break;
    case 'UPDATE_BUDGET':
      newState.budget = { ...state.budget, ...action.payload };
      break;
    case 'RESET_DAILY_SPENT':
      // Reset spent for the new day, keep the limit
      newState.budget = { ...state.budget, spent: 0, lastSetDate: action.payload.today, dailySpent: { [action.payload.today]: 0 } };
      break;
    case 'RESET_STATE_FOR_LOGOUT':
      newState = {
        ...initialState, // Reset to initial defaults
        userId: null,    // Specifically set userId to null
        apiBaseUrl: state.apiBaseUrl, // Persist apiBaseUrl
         // Persist theme and currency from previous state or reset to defaults if preferred
        theme: state.theme || defaultThemeId,
        currency: state.currency || defaultCurrency,
        categories: [...DEFAULT_CATEGORIES], // Ensure categories are reset to pure defaults
        isLoading: false, // Not loading after logout
      };
      if (state.userId && typeof window !== 'undefined') { // Clear storage for the logged-out user
        localStorage.removeItem(`${LOCAL_STORAGE_KEY_PREFIX}${state.userId}`);
      }
      break;
    default:
      newState = state;
  }

  // Save to localStorage after every relevant action for the current user
  if (currentUserId && typeof window !== 'undefined' && action.type !== 'SET_LOADING' && action.type !== 'LOAD_STATE_FROM_LOCALSTORAGE' && action.type !== 'LOAD_STATE_FROM_API') {
    try {
      const stateToSave = { ...newState, isLoading: undefined }; // Don't save isLoading flag
      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${currentUserId}`, JSON.stringify(stateToSave));
    } catch (error) {
      console.error("Failed to save state to localStorage for user:", currentUserId, error);
    }
  }
  return newState;
}

const mergeCategories = (defaultCats: Category[], userCats: Category[]): Category[] => {
    const categoryMap = new Map<string, Category>();
    defaultCats.forEach(cat => categoryMap.set(cat.id, cat));
    userCats.forEach(cat => categoryMap.set(cat.id, cat)); // User's categories will override defaults if IDs match
    return Array.from(categoryMap.values());
};


const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [isInitialDataLoaded, setIsInitialDataLoaded] = useState(false);

  // Effect for loading initial state (anonymous or from localStorage)
  useEffect(() => {
    const loadInitialLocalState = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      console.log("AppProvider: Loading initial local state (anonymous or from localStorage)...");

      let currentUserId = localStorage.getItem(ANONYMOUS_USER_ID_KEY);
      if (!currentUserId) {
        currentUserId = `anon_${uuidv4()}`;
        localStorage.setItem(ANONYMOUS_USER_ID_KEY, currentUserId);
      }
      console.log("AppProvider: Determined userId for local state:", currentUserId);

      let loadedState: Partial<AppState> = { userId: currentUserId }; // Always start with the determined userId

      const savedStateRaw = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${currentUserId}`);
      if (savedStateRaw) {
        try {
          const parsedState = JSON.parse(savedStateRaw) as Omit<AppState, 'userId' | 'isLoading'>;
          loadedState = { ...loadedState, ...parsedState }; // Merge, userId from above takes precedence
          console.log("AppProvider: Loaded state from localStorage for user:", currentUserId, loadedState);
        } catch (e) {
          console.error(`Failed to parse saved state from localStorage for user ${currentUserId}, using defaults:`, e);
        }
      } else {
         console.log("AppProvider: No saved state in localStorage for user:", currentUserId);
      }
      
      // Ensure currency is initialized if not loaded
      if (!loadedState.currency || loadedState.currency.code === defaultCurrency.code) {
        try {
          const detectedCurrency = await getUserCurrency();
          loadedState.currency = detectedCurrency || defaultCurrency;
          if (detectedCurrency) console.log("AppProvider: Currency auto-detected:", detectedCurrency);
          else console.log("AppProvider: Currency auto-detection failed or not available, using default.");
        } catch (e) {
          console.error("AppProvider: Currency auto-detection error:", e);
          loadedState.currency = defaultCurrency;
        }
      }
      
      dispatch({ type: 'LOAD_STATE_FROM_LOCALSTORAGE', payload: loadedState });
      setIsInitialDataLoaded(true);
      console.log("AppProvider: Initial local state processing finished. Current user ID in context:", loadedState.userId);
    };

    if (!isInitialDataLoaded) {
        loadInitialLocalState();
    }
  }, [isInitialDataLoaded]);

  // Effect for fetching API data for authenticated (non-anonymous) users
  useEffect(() => {
    const fetchApiDataForUser = async () => {
      // Only fetch if userId is present, not anonymous, and initial local load is done
      if (state.userId && !state.userId.startsWith('anon_') && isInitialDataLoaded) {
        dispatch({ type: 'SET_LOADING', payload: true });
        console.log(`AppProvider: Fetching API data for authenticated user ${state.userId}...`);
        try {
          const apiResponse = await fetchFromApi(`data/index.php`, { method: 'GET' });
          
          if (apiResponse.success && apiResponse.data) {
            console.log("AppProvider: API data received:", apiResponse.data);
            const { lists = [], items = [], categories: apiCategories = [], user_preferences = {} } = apiResponse.data;
            
            const apiPayload: Partial<AppState> = {
              lists,
              shoppingListItems: items,
              categories: apiCategories, // API categories will be merged with defaults in reducer
              isPremium: user_preferences.is_premium !== undefined ? user_preferences.is_premium : false, // Default to false if not provided
              currency: user_preferences.currency || state.currency, // Prefer API currency, fallback to current
            };
            dispatch({ type: 'LOAD_STATE_FROM_API', payload: apiPayload });
          } else {
            console.error("Failed to fetch data from API for authenticated user:", apiResponse.message);
            dispatch({ type: 'SET_LOADING', payload: false }); // Turn off loading on API failure
          }
        } catch (error) {
          console.error("Error fetching API data for authenticated user:", error);
          dispatch({ type: 'SET_LOADING', payload: false }); // Turn off loading on catch
        }
        // isLoading is set to false within LOAD_STATE_FROM_API or the catch block
      } else if (state.userId && state.userId.startsWith('anon_') && isInitialDataLoaded && state.isLoading) {
         // If it's an anonymous user and initial load is done, but still loading, turn it off.
         dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    fetchApiDataForUser();
  }, [state.userId, isInitialDataLoaded, dispatch, state.isLoading]); // state.isLoading added to deps for anon user case


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
