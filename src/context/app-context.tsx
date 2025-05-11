
"use client";

import React, { createContext, useContext, useReducer, useEffect, useState, useCallback, type ReactNode } from 'react';
import { format, startOfDay, isSameDay } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { getUserCurrency, getSupportedCurrencies, type Currency } from '@/services/currency';
import { themes, defaultThemeId, type Theme } from '@/config/themes';


// --- Constants ---
const LOCAL_STORAGE_KEY = 'neonShoppingState_vLocal_anon_v4'; // Key for anonymous local storage
export const FREEMIUM_LIST_LIMIT = 3; // This will be used if premium logic is re-added
export const FREEMIUM_CATEGORY_LIMIT = 5; // This will be used if premium logic is re-added

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
  userId: string; // Anonymous user ID
  name: string;
  quantity: number;
  price: number;
  category: string;
  checked: boolean;
  dateAdded: number; // Timestamp
}

export interface Category {
  id: string;
  name: string;
  userId: string | null; // null for default, anonymous userId for user-created
}

export interface List {
  id: string;
  userId: string; // Anonymous user ID
  name: string;
  budgetLimit: number;
  defaultCategory: string;
}

interface AppState {
  userId: string | null; // Will store the anonymous UUID
  currency: Currency;
  supportedCurrencies: Currency[];
  lists: List[];
  selectedListId: string | null;
  shoppingListItems: ShoppingListItem[];
  categories: Category[];
  theme: string; // Theme ID string
  isLoading: boolean;
  isInitialDataLoaded: boolean;
  isPremium: boolean; // Kept for potential future re-integration, defaults to true for local
}

interface AppContextProps {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  formatCurrency: (amount: number) => string;
  isLoading: boolean; //isLoading from AppContext
}

const defaultCurrency: Currency = { code: 'USD', symbol: '$', name: 'US Dollar' };

const initialState: AppState = {
  userId: null, // Initially null, will be set to anonymous UUID
  currency: defaultCurrency,
  supportedCurrencies: [defaultCurrency],
  lists: [],
  selectedListId: null,
  shoppingListItems: [],
  categories: [...DEFAULT_CATEGORIES],
  theme: defaultThemeId,
  isLoading: true,
  isInitialDataLoaded: false,
  isPremium: true, // All features enabled by default in local storage version
};

type Action =
  | { type: 'LOAD_STATE'; payload: Partial<Omit<AppState, 'isLoading' | 'isInitialDataLoaded' | 'supportedCurrencies'>> & { userId: string | null, supportedCurrencies: Currency[], isPremium: boolean } }
  | { type: 'SET_CURRENCY'; payload: Currency }
  | { type: 'ADD_LIST'; payload: List }
  | { type: 'UPDATE_LIST'; payload: List }
  | { type: 'DELETE_LIST'; payload: string }
  | { type: 'SELECT_LIST'; payload: string | null }
  | { type: 'ADD_SHOPPING_ITEM'; payload: ShoppingListItem }
  | { type: 'UPDATE_SHOPPING_ITEM'; payload: ShoppingListItem }
  | { type: 'REMOVE_SHOPPING_ITEM'; payload: string }
  | { type: 'TOGGLE_SHOPPING_ITEM'; payload: string }
  | { type: 'ADD_CATEGORY'; payload: { name: string } }
  | { type: 'UPDATE_CATEGORY'; payload: { id: string; name: string } }
  | { type: 'REMOVE_CATEGORY'; payload: { categoryId: string; reassignToId?: string } }
  | { type: 'SET_THEME'; payload: string }
  | { type: 'SET_USER_ID'; payload: string | null } // For anonymous user ID
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_PREMIUM_STATUS'; payload: boolean }; // Kept for consistency, but isPremium is true

// Helper to merge categories, ensuring defaults are present and user-specific are tied to current anonymous user
const mergeCategories = (defaultCats: Category[], storedCats: Category[] | undefined, currentUserId: string | null): Category[] => {
  const categoryMap = new Map<string, Category>();
  // Add all global default categories
  defaultCats.forEach(cat => categoryMap.set(cat.id, { ...cat, userId: null }));

  // Add/overwrite with stored categories IF they are global OR belong to the current anonymous user
  if (storedCats && currentUserId) {
    storedCats.forEach(cat => {
      if (cat.userId === null || cat.userId === currentUserId) {
        categoryMap.set(cat.id, cat);
      }
    });
  }
  return Array.from(categoryMap.values());
};

function appReducer(state: AppState, action: Action): AppState {
  let newState = { ...state };

  switch (action.type) {
    case 'LOAD_STATE':
      const { userId: loadedUserId, supportedCurrencies: loadedSupportedCurrenciesFromPayload, isPremium: loadedIsPremium, ...restOfPayload } = action.payload;
      newState = {
        ...initialState, // Start from a clean slate but keep some defaults
        ...restOfPayload,
        userId: loadedUserId, // This will be the anonymous UUID
        currency: restOfPayload.currency || initialState.currency,
        supportedCurrencies: Array.isArray(loadedSupportedCurrenciesFromPayload) && loadedSupportedCurrenciesFromPayload.length > 0 ? loadedSupportedCurrenciesFromPayload : [initialState.currency],
        categories: mergeCategories(DEFAULT_CATEGORIES, restOfPayload.categories, loadedUserId),
        theme: restOfPayload.theme || defaultThemeId,
        isLoading: false,
        isInitialDataLoaded: true,
        isPremium: true, // All features enabled for local storage version
      };
       // Auto-select first list if available for the current anonymous user
      if (newState.lists && newState.lists.length > 0 && loadedUserId) {
          const userLists = newState.lists.filter(l => l.userId === loadedUserId);
          if (userLists.length > 0) {
              const currentSelectedListIsValid = userLists.some(l => l.id === newState.selectedListId);
              newState.selectedListId = currentSelectedListIsValid ? newState.selectedListId : userLists[0].id;
          } else {
              newState.selectedListId = null;
          }
      } else {
         newState.selectedListId = null;
      }
      break;
    case 'SET_USER_ID': // Used for setting the anonymous UUID
      newState.userId = action.payload;
      // If user ID becomes null (shouldn't happen in pure local storage model after initial load), reset relevant parts
      if (!action.payload) {
        newState.lists = [];
        newState.shoppingListItems = [];
        newState.categories = [...DEFAULT_CATEGORIES];
        newState.selectedListId = null;
        newState.isPremium = true; // Default to all features enabled
      }
      break;
    case 'SET_CURRENCY':
      newState.currency = action.payload;
      break;
    case 'ADD_LIST':
      if (!state.userId) {
        console.error("Cannot add list: No anonymous user ID set.");
        return state;
      }
      const newListWithUserId: List = { ...action.payload, userId: state.userId };
      newState.lists = [...state.lists, newListWithUserId];
      const userListsAfterAdd = newState.lists.filter(l => l.userId === state.userId);
      if (userListsAfterAdd.length === 1) { // If this is the first list for the user
        newState.selectedListId = newListWithUserId.id;
      }
      break;
    case 'UPDATE_LIST':
      if (!state.userId) return state;
      newState.lists = state.lists.map(list =>
        list.id === action.payload.id && list.userId === state.userId ? { ...action.payload, userId: state.userId } : list
      );
      break;
    case 'DELETE_LIST':
      if (!state.userId) return state;
      const listToDelete = state.lists.find(l => l.id === action.payload);
      if (listToDelete && listToDelete.userId === state.userId) {
        newState.lists = state.lists.filter(list => list.id !== action.payload);
        newState.shoppingListItems = state.shoppingListItems.filter(item =>
          !(item.listId === action.payload && item.userId === state.userId)
        );
        if (state.selectedListId === action.payload) {
          const userListsRemaining = newState.lists.filter(l => l.userId === state.userId);
          newState.selectedListId = userListsRemaining.length > 0 ? userListsRemaining[0].id : null;
        }
      }
      break;
    case 'SELECT_LIST':
       if (!state.userId && action.payload !== null) { // Should not happen if userId is always set
          newState.selectedListId = null;
       } else {
        const listToSelect = state.lists.find(l => l.id === action.payload);
        // Ensure the list belongs to the current anonymous user or is a general selection (null)
        if (action.payload === null || (listToSelect && listToSelect.userId === state.userId)) {
          newState.selectedListId = action.payload;
        }
      }
      break;
    case 'ADD_SHOPPING_ITEM': {
      if (!action.payload.listId || !action.payload.userId) {
        console.error("Attempted to add item without listId or userId");
        return state;
      }
       if (action.payload.userId !== state.userId) { // Ensure item is for current anonymous user
        console.error("Attempted to add item for a different user ID.");
        return state;
      }
      const newItem: ShoppingListItem = { ...action.payload };
      newState.shoppingListItems = [...state.shoppingListItems, newItem];
      break;
    }
    case 'UPDATE_SHOPPING_ITEM':
      if (!state.userId) return state;
      newState.shoppingListItems = state.shoppingListItems.map(item =>
        item.id === action.payload.id && item.userId === state.userId ? { ...action.payload, userId: state.userId } : item
      );
      break;
    case 'REMOVE_SHOPPING_ITEM':
      if (!state.userId) return state;
      const itemToRemove = state.shoppingListItems.find(item => item.id === action.payload);
      if (itemToRemove && itemToRemove.userId === state.userId) {
        newState.shoppingListItems = state.shoppingListItems.filter(item => item.id !== action.payload);
      }
      break;
    case 'TOGGLE_SHOPPING_ITEM':
      if (!state.userId) return state;
      const itemToToggle = state.shoppingListItems.find(item => item.id === action.payload);
      if (itemToToggle && itemToToggle.userId === state.userId) {
        newState.shoppingListItems = state.shoppingListItems.map(item =>
          item.id === action.payload ? { ...item, checked: !item.checked, dateAdded: Date.now(), userId: state.userId } : item
        );
      }
      break;
    case 'ADD_CATEGORY':
      if (!state.userId) {
        console.error("Cannot add category: No anonymous user ID set.");
        return state;
      }
      const newCategory: Category = {
        id: uuidv4(),
        name: action.payload.name,
        userId: state.userId, // Associate with current anonymous user
      };
      newState.categories = [...state.categories, newCategory];
      break;
    case 'UPDATE_CATEGORY':
      const categoryToUpdate = state.categories.find(c => c.id === action.payload.id);
      // Allow updating global (userId: null) or user-specific categories
      if (categoryToUpdate && (categoryToUpdate.userId === null || categoryToUpdate.userId === state.userId)) {
        newState.categories = state.categories.map(cat =>
          cat.id === action.payload.id ? { ...cat, name: action.payload.name } : cat
        );
      }
      break;
    case 'REMOVE_CATEGORY':
      const categoryToRemove = state.categories.find(c => c.id === action.payload.categoryId);
      // Only allow removing user-created categories (userId matches current anonymous user)
      // Default categories (userId: null) or 'uncategorized' cannot be removed this way.
      if (categoryToRemove && categoryToRemove.userId === state.userId && categoryToRemove.id !== 'uncategorized') {
        newState.categories = state.categories.filter(cat => cat.id !== action.payload.categoryId);
        const reassignId = action.payload.reassignToId || 'uncategorized';
        // Reassign items and list defaults for the current anonymous user
        if (state.userId) {
            newState.shoppingListItems = state.shoppingListItems.map(item =>
                item.category === action.payload.categoryId && item.userId === state.userId ? { ...item, category: reassignId } : item
            );
            newState.lists = state.lists.map(list =>
                list.defaultCategory === action.payload.categoryId && list.userId === state.userId ? { ...list, defaultCategory: reassignId } : list
            );
        }
      }
      break;
    case 'SET_THEME':
      newState.theme = action.payload;
      break;
    case 'SET_LOADING':
      newState = { ...state, isLoading: action.payload };
      break;
    case 'SET_PREMIUM_STATUS': // Kept for structure, but effectively always true
      newState.isPremium = true; // Always true for local storage version
      break;
    default:
      return state;
  }

  // Persist state to localStorage for the current anonymous user
  if (state.userId && typeof window !== 'undefined' && action.type !== 'LOAD_STATE' && action.type !== 'SET_LOADING') {
    try {
      const userSpecificStorageKey = `${LOCAL_STORAGE_KEY}_${state.userId}`;
      // Omit fields that shouldn't be persisted or are derived
      const { isLoading: _omittedIsLoading, isInitialDataLoaded: _omittedIsInitial, ...stateToSave } = newState;
      localStorage.setItem(userSpecificStorageKey, JSON.stringify(stateToSave));
    } catch (error) {
      console.error("Failed to save state to localStorage:", error);
    }
  }
  return newState;
}

export const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  // isLoading and isInitialDataLoaded are now part of the reducer state

  useEffect(() => {
    const loadInitialData = async () => {
      dispatch({ type: 'SET_LOADING', payload: true }); // Start loading
      console.log("AppProvider: Loading initial data (anonymous)...");

      // --- Anonymous User ID Handling ---
      let userId = localStorage.getItem('app_user_id_vLocal_anon_v4'); // Use a consistent key
      if (!userId) {
        userId = `anon_${uuidv4()}`;
        localStorage.setItem('app_user_id_vLocal_anon_v4', userId);
        console.log("AppProvider: Generated new anonymous user ID:", userId);
      } else {
        console.log("AppProvider: Found existing anonymous user ID:", userId);
      }
      // Immediately dispatch the user ID so it's available for subsequent localStorage key generation
      dispatch({ type: 'SET_USER_ID', payload: userId });


      // --- Load State from localStorage specific to this anonymous user ---
      let loadedStateFromStorage: Partial<Omit<AppState, 'isLoading' | 'isInitialDataLoaded' | 'userId' | 'supportedCurrencies' | 'theme'>> = {};
      const userSpecificStorageKey = `${LOCAL_STORAGE_KEY}_${userId}`; // Use the determined/generated userId
      const storedStateRaw = localStorage.getItem(userSpecificStorageKey);

      if (storedStateRaw) {
        try {
          loadedStateFromStorage = JSON.parse(storedStateRaw);
          console.log("AppProvider: Loaded state from localStorage for user:", userId);
        } catch (e) {
          console.error("AppProvider: Failed to parse stored state for user:", userId, e);
          // Potentially clear the corrupted storage for this user
          localStorage.removeItem(userSpecificStorageKey);
        }
      } else {
        console.log("AppProvider: No saved state found in localStorage for user:", userId);
      }

      // --- Currency Handling (auto-detect or use stored) ---
      let currencyToSet = defaultCurrency;
      let allSupportedCurrencies: Currency[] = [defaultCurrency]; // Default if fetch fails

      if (loadedStateFromStorage.currency) {
        currencyToSet = loadedStateFromStorage.currency;
         console.log("AppProvider: Using currency from localStorage:", currencyToSet);
      } else {
        try {
          const detectedCurrency = await getUserCurrency();
          if (detectedCurrency) {
            currencyToSet = detectedCurrency;
            console.log("AppProvider: Currency auto-detected:", currencyToSet);
          } else {
            console.log("AppProvider: Currency auto-detection failed, using default USD.");
          }
        } catch (e) {
          console.error("AppProvider: Currency auto-detection error:", e);
        }
      }

      try {
        const fetchedCurrencies = await getSupportedCurrencies();
        if (Array.isArray(fetchedCurrencies) && fetchedCurrencies.length > 0) {
          allSupportedCurrencies = fetchedCurrencies;
        } else {
          console.warn("AppProvider: getSupportedCurrencies did not return a valid array, using default.");
        }
      } catch (e) {
        console.error("AppProvider: Failed to fetch supported currencies list:", e);
      }
      
      // --- Final Dispatch to Load State ---
      const finalPayload = {
        ...loadedStateFromStorage, // Spread loaded state first
        userId: userId, // Crucially set the determined/generated userId
        currency: currencyToSet,
        supportedCurrencies: allSupportedCurrencies,
        isPremium: true, // All features are enabled for local storage version
        // Ensure categories and lists are filtered for the current anonymous user if they weren't already
        lists: (loadedStateFromStorage.lists || []).filter(l => l.userId === userId),
        shoppingListItems: (loadedStateFromStorage.shoppingListItems || []).filter(i => i.userId === userId),
        categories: loadedStateFromStorage.categories, // Will be merged in reducer
        theme: loadedStateFromStorage.theme || defaultThemeId,
      };

      dispatch({ type: 'LOAD_STATE', payload: finalPayload });
      // SET_LOADING to false and isInitialDataLoaded to true is handled by 'LOAD_STATE' reducer
      console.log("AppProvider: Initial data processing finished. Current user ID in context:", userId);
    };

    // Only run if initial data hasn't been loaded yet (controlled by reducer state now)
    if (!state.isInitialDataLoaded) {
        loadInitialData();
    }
}, [state.isInitialDataLoaded]); // Depend on isInitialDataLoaded from state


  const formatCurrency = useCallback((amount: number) => {
    try {
      return new Intl.NumberFormat(undefined, { // Uses browser's default locale
        style: 'currency',
        currency: state.currency.code,
      }).format(amount);
    } catch (error) {
      console.warn("Currency formatting error for code:", state.currency.code, error);
      // Fallback formatting if Intl fails (e.g., invalid currency code)
      return `${state.currency.symbol || '$'}${amount.toFixed(2)}`;
    }
  }, [state.currency]);

  // Pass the isLoading state from the reducer to the provider value
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

