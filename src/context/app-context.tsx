// src/context/app-context.tsx
"use client";

import React, { createContext, useContext, useReducer, useEffect, useState, useCallback, type ReactNode } from 'react';
import { format, startOfDay, isSameDay } from 'date-fns';
import { themes, defaultThemeId } from '@/config/themes';
import { v4 as uuidv4 } from 'uuid';
import { getUserCurrency, type Currency } from '../services/currency'; // Corrected path
import { fetchFromApi } from '../lib/api'; // Corrected path

const LOCAL_STORAGE_KEY = 'neonShoppingState_v3';
export const FREEMIUM_LIST_LIMIT = 3;
export const FREEMIUM_CATEGORY_LIMIT = 5; // User-defined categories, excluding defaults

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
  userId: string | null; // null for default categories, userId for user-created
}

export interface List {
  id: string;
  userId: string;
  name: string;
  budgetLimit: number;
  defaultCategory: string;
}

interface AppState {
  userId: string | null;
  apiBaseUrl: string;
  theme: string;
  currency: Currency;
  lists: List[];
  selectedListId: string | null;
  shoppingListItems: ShoppingListItem[];
  categories: Category[];
  isLoading: boolean;
  isPremium: boolean;
}

interface AppContextProps {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  formatCurrency: (amount: number) => string;
  isLoading: boolean; // Expose isLoading for consumers
}

const defaultCurrency: Currency = { code: 'USD', symbol: '$', name: 'US Dollar' };

const initialState: AppState = {
  userId: null, // Will be set to anonymous UUID or actual user ID
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || 'https://digitalfiroj.com/neon/api',
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
  | { type: 'SET_USER_ID'; payload: string | null }
  | { type: 'SET_THEME'; payload: string }
  | { type: 'SET_CURRENCY'; payload: Currency }
  | { type: 'ADD_LIST'; payload: List }
  | { type: 'UPDATE_LIST'; payload: List }
  | { type: 'DELETE_LIST'; payload: string }
  | { type: 'SELECT_LIST'; payload: string | null }
  | { type: 'ADD_SHOPPING_ITEM'; payload: ShoppingListItem } // Changed to full ShoppingListItem
  | { type: 'UPDATE_SHOPPING_ITEM'; payload: ShoppingListItem }
  | { type: 'REMOVE_SHOPPING_ITEM'; payload: string }
  | { type: 'TOGGLE_SHOPPING_ITEM'; payload: string }
  | { type: 'ADD_CATEGORY'; payload: Category } // Changed to full Category
  | { type: 'UPDATE_CATEGORY'; payload: Category }
  | { type: 'REMOVE_CATEGORY'; payload: { categoryId: string; reassignToId?: string } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_PREMIUM_STATUS'; payload: boolean }
  | { type: 'RESET_STATE_FOR_LOGOUT' };

function appReducer(state: AppState, action: Action): AppState {
  let newState = { ...state };
  switch (action.type) {
    case 'LOAD_STATE':
      newState = { ...state, ...action.payload, isLoading: false };
      // Ensure default categories are always present and unique
      if (action.payload.categories) {
        const uniqueCategories = new Map<string, Category>();
        DEFAULT_CATEGORIES.forEach(cat => uniqueCategories.set(cat.id, cat));
        action.payload.categories.forEach(cat => uniqueCategories.set(cat.id, cat));
        newState.categories = Array.from(uniqueCategories.values());
      } else if (!state.categories || state.categories.length === 0) {
        newState.categories = [...DEFAULT_CATEGORIES];
      }
      // Ensure selectedListId is valid
      if (newState.lists.length > 0 && !newState.lists.find(l => l.id === newState.selectedListId)) {
        const userLists = newState.lists.filter(l => l.userId === newState.userId);
        newState.selectedListId = userLists.length > 0 ? userLists[0].id : null;
      } else if (newState.lists.length === 0) {
        newState.selectedListId = null;
      }
      break;
    case 'SET_USER_ID':
      newState = { ...state, userId: action.payload };
      if (!action.payload) { // Full reset if logging out (userId is null)
        newState.lists = [];
        newState.shoppingListItems = [];
        newState.selectedListId = null;
        newState.categories = [...DEFAULT_CATEGORIES];
        newState.isPremium = false; // Reset premium status on logout
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
      const userListsCount = state.lists.filter(l => l.userId === newState.userId).length;
      if (!state.isPremium && userListsCount >= FREEMIUM_LIST_LIMIT) {
        console.warn("Freemium list limit reached.");
        // Potentially show a toast here
        return state;
      }
      newState.lists = [...state.lists, action.payload]; // Assuming payload has id and userId
      if (!state.selectedListId || state.lists.filter(l => l.userId === newState.userId).length === 0) {
        newState.selectedListId = action.payload.id;
      }
      break;
    case 'UPDATE_LIST':
      if (!newState.userId || action.payload.userId !== newState.userId) return state;
      newState.lists = state.lists.map(list =>
        list.id === action.payload.id ? action.payload : list
      );
      break;
    case 'DELETE_LIST':
      const listToDelete = state.lists.find(l => l.id === action.payload);
      if (!listToDelete || listToDelete.userId !== newState.userId) return state;
      newState.lists = state.lists.filter(list => list.id !== action.payload);
      newState.shoppingListItems = state.shoppingListItems.filter(item => item.listId !== action.payload);
      if (state.selectedListId === action.payload) {
        const userLists = newState.lists.filter(l => l.userId === newState.userId);
        newState.selectedListId = userLists.length > 0 ? userLists[0].id : null;
      }
      break;
    case 'SELECT_LIST':
      const listToSelect = state.lists.find(l => l.id === action.payload);
      if (action.payload !== null && (!listToSelect || listToSelect.userId !== newState.userId)) {
        return state;
      }
      newState.selectedListId = action.payload;
      break;
    case 'ADD_SHOPPING_ITEM':
      if (!newState.userId || action.payload.userId !== newState.userId) return state;
      newState.shoppingListItems = [...state.shoppingListItems, action.payload];
      break;
    case 'UPDATE_SHOPPING_ITEM':
      if (!newState.userId || action.payload.userId !== newState.userId) return state;
      newState.shoppingListItems = state.shoppingListItems.map(item =>
        item.id === action.payload.id ? action.payload : item
      );
      break;
    case 'REMOVE_SHOPPING_ITEM':
      const itemToRemove = state.shoppingListItems.find(item => item.id === action.payload);
      if (!itemToRemove || !newState.userId || itemToRemove.userId !== newState.userId) return state;
      newState.shoppingListItems = state.shoppingListItems.filter(item => item.id !== action.payload);
      break;
    case 'TOGGLE_SHOPPING_ITEM':
      const itemToToggle = state.shoppingListItems.find(item => item.id === action.payload);
      if (!itemToToggle || !newState.userId || itemToToggle.userId !== newState.userId) return state;
      newState.shoppingListItems = state.shoppingListItems.map(item =>
        item.id === action.payload ? { ...item, checked: !item.checked, dateAdded: Date.now() } : item
      );
      break;
    case 'ADD_CATEGORY':
      if (!newState.userId) return state;
      const userCustomCategoriesCount = state.categories.filter(c => c.userId === newState.userId).length;
      if (!state.isPremium && userCustomCategoriesCount >= FREEMIUM_CATEGORY_LIMIT) {
         console.warn("Freemium custom category limit reached.");
         return state;
      }
      newState.categories = [...state.categories, action.payload]; // Assuming payload has id and userId
      break;
    case 'UPDATE_CATEGORY':
      const categoryToUpdate = state.categories.find(c => c.id === action.payload.id);
      if (!categoryToUpdate || (categoryToUpdate.userId && categoryToUpdate.userId !== newState.userId)) return state;
      if (categoryToUpdate.userId === null && !state.isPremium) return state; // Freemium cannot edit defaults
      newState.categories = state.categories.map(cat =>
        cat.id === action.payload.id ? action.payload : cat
      );
      break;
    case 'REMOVE_CATEGORY':
      const categoryToRemove = state.categories.find(c => c.id === action.payload.categoryId);
      if (!categoryToRemove || categoryToRemove.id === 'uncategorized') return state;
      if (categoryToRemove.userId === null && !state.isPremium) return state; // Freemium cannot delete defaults
      if (categoryToRemove.userId && categoryToRemove.userId !== newState.userId) return state;

      newState.categories = state.categories.filter(cat => cat.id !== action.payload.categoryId);
      if (newState.userId) {
        const reassignId = action.payload.reassignToId || 'uncategorized';
        newState.shoppingListItems = state.shoppingListItems.map(item =>
          item.category === action.payload.categoryId && item.userId === newState.userId
          ? { ...item, category: reassignId }
          : item
        );
        newState.lists = state.lists.map(list =>
          list.defaultCategory === action.payload.categoryId && list.userId === newState.userId
          ? { ...list, defaultCategory: reassignId }
          : list
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
      newState = {
        ...initialState,
        userId: null,
        apiBaseUrl: state.apiBaseUrl, // Keep API base URL
        theme: state.theme, // Keep theme
        currency: state.currency, // Keep currency (or reset to default/re-detect)
        categories: [...DEFAULT_CATEGORIES], // Reset categories
        isLoading: false,
      };
      // Clear user-specific localStorage on logout
      if (state.userId && typeof window !== 'undefined') {
        localStorage.removeItem(`${LOCAL_STORAGE_KEY}_${state.userId}`);
      }
      break;
    default:
      newState = state;
  }

  // Persist state to localStorage if a user ID is present (anonymous or authenticated)
  if (newState.userId && typeof window !== 'undefined') {
    try {
      const stateToSave = { ...newState, isLoading: undefined }; // Don't save isLoading
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_${newState.userId}`, JSON.stringify(stateToSave));
    } catch (error) {
      console.error("Failed to save state to localStorage for user:", newState.userId, error);
    }
  }
  return newState;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [isInitialDataLoaded, setIsInitialDataLoaded] = useState(false);

  // Effect for loading initial state (anonymous or from localStorage)
  useEffect(() => {
    const loadInitialData = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      console.log("AppProvider: Loading initial data (anonymous or from localStorage)...");

      let userIdFromAuth = state.userId; // Check if AuthProvider already set a real userId
      let localStateKey = LOCAL_STORAGE_KEY;
      let loadedState: Partial<AppState> = {};

      if (userIdFromAuth && !userIdFromAuth.startsWith('anon_')) {
        // Authenticated user ID is already set by AuthProvider
        localStateKey = `${LOCAL_STORAGE_KEY}_${userIdFromAuth}`;
        console.log("AppProvider: Authenticated user ID found in state:", userIdFromAuth);
      } else {
        // No authenticated user yet, handle anonymous or load from localStorage
        const anonymousUserId = localStorage.getItem('anonymous_user_id_neon_shopping') || `anon_${uuidv4()}`;
        if (!localStorage.getItem('anonymous_user_id_neon_shopping')) {
          localStorage.setItem('anonymous_user_id_neon_shopping', anonymousUserId);
        }
        localStateKey = `${LOCAL_STORAGE_KEY}_${anonymousUserId}`;
        loadedState.userId = anonymousUserId; // Tentatively set, AuthProvider might override
        console.log("AppProvider: No authenticated user from AuthContext yet, using/generating anonymous ID:", anonymousUserId);
      }

      const savedStateRaw = localStorage.getItem(localStateKey);
      if (savedStateRaw) {
        try {
          const parsedState = JSON.parse(savedStateRaw);
          // Merge, ensuring userId from AuthProvider (if set) or anonymous takes precedence
          loadedState = { ...parsedState, ...loadedState };
        } catch (e) {
          console.error(`Failed to parse saved state from key ${localStateKey}, using defaults:`, e);
        }
      }
      
      if (!loadedState.currency || loadedState.currency.code === defaultCurrency.code) {
        try {
          const detectedCurrency = await getUserCurrency();
          loadedState.currency = detectedCurrency || defaultCurrency;
        } catch (e) {
          console.error("AppProvider: Currency auto-detection failed:", e);
          loadedState.currency = defaultCurrency;
        }
      }

      const finalCategories = new Map<string, Category>();
      DEFAULT_CATEGORIES.forEach(cat => finalCategories.set(cat.id, cat));
      (loadedState.categories || []).forEach(cat => finalCategories.set(cat.id, cat));
      loadedState.categories = Array.from(finalCategories.values());

      // If AuthProvider already set a real userId, ensure it's used.
      // Otherwise, the anonymous or loaded userId will be used.
      if (userIdFromAuth && !userIdFromAuth.startsWith('anon_')) {
        loadedState.userId = userIdFromAuth;
      }
      
      dispatch({ type: 'LOAD_STATE', payload: loadedState });
      setIsInitialDataLoaded(true); // Mark initial load as complete
      // SET_LOADING to false is handled by LOAD_STATE
      console.log("AppProvider: Initial data processing finished. Current user ID in context:", newState.userId);
    };

    // Only run if initial data hasn't been loaded yet.
    // AuthProvider will update state.userId, which can then trigger data fetch for authenticated users.
    if (!isInitialDataLoaded) {
      loadInitialData().finally(() => {
        // Ensure loading is false even if loadInitialData itself has an unhandled issue in its try/finally
         dispatch({ type: 'SET_LOADING', payload: false });
      });
    }
  }, [isInitialDataLoaded, state.userId]); // Depend on state.userId to react to changes from AuthProvider

  // Effect for fetching API data for authenticated users
  useEffect(() => {
    const fetchApiDataForUser = async () => {
      // Only fetch if we have a real (non-anonymous) userId and initial local/anonymous load is done
      if (state.userId && !state.userId.startsWith('anon_') && isInitialDataLoaded) {
        dispatch({ type: 'SET_LOADING', payload: true });
        console.log(`AppProvider: Fetching API data for user ${state.userId}...`);
        try {
          const apiResponse = await fetchFromApi(`data/index.php`, { method: 'GET' });
          
          if (apiResponse.success && apiResponse.data) {
            const { lists = [], items = [], categories: apiCategories = [], user_preferences = {} } = apiResponse.data;
            
            const finalCategoriesMap = new Map<string, Category>();
            DEFAULT_CATEGORIES.forEach(cat => finalCategoriesMap.set(cat.id, cat));
            (apiCategories as Category[]).forEach(cat => finalCategoriesMap.set(cat.id, cat));

            dispatch({
              type: 'LOAD_STATE',
              payload: {
                lists,
                shoppingListItems: items,
                categories: Array.from(finalCategoriesMap.values()),
                selectedListId: lists.length > 0 ? (lists.find((l:List) => l.userId === state.userId)?.id || lists[0].id) : null,
                currency: user_preferences.currency || state.currency,
                isPremium: user_preferences.is_premium !== undefined ? user_preferences.is_premium : state.isPremium,
              },
            });
          } else {
            console.error("Failed to fetch data from API for authenticated user:", apiResponse.message);
            // If API fails for an authenticated user, consider if local storage for that user should be cleared or used as fallback
          }
        } catch (error) {
          console.error("Error fetching API data for authenticated user:", error);
        } finally {
          dispatch({ type: 'SET_LOADING', payload: false });
          console.log("AppProvider: API data fetch finished for user", state.userId);
        }
      }
    };

    fetchApiDataForUser();
  }, [state.userId, state.apiBaseUrl, isInitialDataLoaded]);


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
