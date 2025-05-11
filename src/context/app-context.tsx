"use client";

import React, { createContext, useContext, useReducer, useEffect, useState, useCallback, type ReactNode } from 'react';
import { format, startOfDay, isSameDay } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { getUserCurrency, type Currency } from '@/services/currency';
import { defaultThemeId } from '@/config/themes';

const LOCAL_STORAGE_KEY = 'neonShoppingState_vLocal_anon_v4';
export const FREEMIUM_LIST_LIMIT = 3;
export const FREEMIUM_CATEGORY_LIMIT = 5; // Not strictly enforced now, but kept for potential future use or UI text

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
  dateAdded: number; // Timestamp
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
  currency: Currency;
  supportedCurrencies: Currency[];
  lists: List[];
  selectedListId: string | null;
  shoppingListItems: ShoppingListItem[];
  categories: Category[];
  theme: string;
  isLoading: boolean;
  isInitialDataLoaded: boolean;
  // isPremium: boolean; // Premium features removed
}

interface AppContextProps {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  formatCurrency: (amount: number) => string;
}

const defaultCurrency: Currency = { code: 'USD', symbol: '$', name: 'US Dollar' };

const initialState: AppState = {
  userId: null,
  currency: defaultCurrency,
  supportedCurrencies: [defaultCurrency], // Initialize with default to prevent map errors
  lists: [],
  selectedListId: null,
  shoppingListItems: [],
  categories: [...DEFAULT_CATEGORIES],
  theme: defaultThemeId,
  isLoading: true,
  isInitialDataLoaded: false,
  // isPremium: false, // Premium features removed
};

type Action =
  | { type: 'LOAD_STATE'; payload: Partial<Omit<AppState, 'isLoading' | 'isInitialDataLoaded' | 'supportedCurrencies'>> & { userId: string | null, supportedCurrencies: Currency[] } }
  | { type: 'SET_CURRENCY'; payload: Currency }
  | { type: 'ADD_LIST'; payload: List }
  | { type: 'UPDATE_LIST'; payload: List }
  | { type: 'DELETE_LIST'; payload: string }
  | { type: 'SELECT_LIST'; payload: string | null }
  | { type: 'ADD_SHOPPING_ITEM'; payload: Omit<ShoppingListItem, 'id' | 'userId' | 'dateAdded' | 'checked'> }
  | { type: 'UPDATE_SHOPPING_ITEM'; payload: ShoppingListItem }
  | { type: 'REMOVE_SHOPPING_ITEM'; payload: string }
  | { type: 'TOGGLE_SHOPPING_ITEM'; payload: string }
  | { type: 'ADD_CATEGORY'; payload: { name: string } }
  | { type: 'UPDATE_CATEGORY'; payload: { id: string; name: string } }
  | { type: 'REMOVE_CATEGORY'; payload: { categoryId: string; reassignToId?: string } }
  | { type: 'SET_THEME'; payload: string }
  | { type: 'SET_USER_ID'; payload: string | null } // For anonymous user ID management
  | { type: 'SET_LOADING'; payload: boolean };


const mergeCategories = (defaultCats: Category[], storedCats: Category[] | undefined, currentUserId: string | null): Category[] => {
  const categoryMap = new Map<string, Category>();
  defaultCats.forEach(cat => categoryMap.set(cat.id, { ...cat, userId: null })); // Ensure default categories have null userId

  if (storedCats) {
    storedCats.forEach(cat => {
      // Keep default categories and user-specific categories
      if (cat.userId === null || (currentUserId && cat.userId === currentUserId)) {
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
      const { userId: loadedUserId, supportedCurrencies: loadedSupportedCurrenciesFromPayload, ...restOfPayload } = action.payload;
      newState = {
        ...initialState, // Start from a clean slate
        ...restOfPayload,
        userId: loadedUserId, // This should be the anonymous ID initially
        currency: restOfPayload.currency || initialState.currency,
        supportedCurrencies: Array.isArray(loadedSupportedCurrenciesFromPayload) && loadedSupportedCurrenciesFromPayload.length > 0 ? loadedSupportedCurrenciesFromPayload : [initialState.currency],
        categories: mergeCategories(DEFAULT_CATEGORIES, restOfPayload.categories, loadedUserId),
        theme: restOfPayload.theme || initialState.theme,
        isLoading: false,
        isInitialDataLoaded: true,
      };
      // Select first list if available for the current user (anonymous)
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
    case 'SET_USER_ID': // Handles setting/clearing user ID (for anonymous user)
      newState.userId = action.payload;
      if (!action.payload) { // If user logs out or becomes anonymous with no data
        newState.lists = [];
        newState.shoppingListItems = [];
        newState.categories = [...DEFAULT_CATEGORIES];
        newState.selectedListId = null;
      }
      break;
    case 'SET_CURRENCY':
      newState.currency = action.payload;
      break;
    case 'ADD_LIST':
      if (!state.userId) {
        console.error("Cannot add list: No user ID set.");
        return state;
      }
      const newListWithUserId: List = { ...action.payload, userId: state.userId };
      newState.lists = [...state.lists, newListWithUserId];
      const userListsAfterAdd = newState.lists.filter(l => l.userId === state.userId);
      if (userListsAfterAdd.length === 1) { // Auto-select if it's the first list for this user
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
      if (!state.userId && action.payload !== null) { // Prevent selecting a list if no user (e.g. after logout)
          newState.selectedListId = null;
      } else {
        const listToSelect = state.lists.find(l => l.id === action.payload);
        // Allow selecting null, or a list belonging to the current user
        if (action.payload === null || (listToSelect && listToSelect.userId === state.userId)) {
          newState.selectedListId = action.payload;
        }
      }
      break;
    case 'ADD_SHOPPING_ITEM': {
      if (!state.userId || !state.selectedListId) {
        console.error("Attempted to add item without userId or selectedListId");
        return state;
      }
      const newItem: ShoppingListItem = {
        id: uuidv4(),
        userId: state.userId,
        listId: state.selectedListId,
        name: action.payload.name,
        quantity: action.payload.quantity,
        price: action.payload.price,
        category: action.payload.category,
        checked: false,
        dateAdded: Date.now(),
      };
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
        console.error("Cannot add category: No user ID set.");
        return state;
      }
      const newCategory: Category = {
        id: uuidv4(),
        name: action.payload.name,
        userId: state.userId, // User-specific category
      };
      newState.categories = [...state.categories, newCategory];
      break;
    case 'UPDATE_CATEGORY':
      const categoryToUpdate = state.categories.find(c => c.id === action.payload.id);
      // Only allow updating user-created categories
      if (categoryToUpdate && categoryToUpdate.userId === state.userId) {
        newState.categories = state.categories.map(cat =>
          cat.id === action.payload.id ? { ...cat, name: action.payload.name } : cat
        );
      }
      break;
    case 'REMOVE_CATEGORY':
      const categoryToRemove = state.categories.find(c => c.id === action.payload.categoryId);
      // Only allow deleting user-created categories, and not 'uncategorized'
      if (categoryToRemove && categoryToRemove.userId === state.userId && categoryToRemove.id !== 'uncategorized') {
        newState.categories = state.categories.filter(cat => cat.id !== action.payload.categoryId);
        const reassignId = action.payload.reassignToId || 'uncategorized';
        if (state.userId) { // Ensure userId exists for item reassignment
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
    default:
      return state;
  }

  // Save state to localStorage for anonymous user data, identified by their anonymous ID
  if (state.userId && typeof window !== 'undefined' && action.type !== 'LOAD_STATE' && action.type !== 'SET_LOADING') {
    try {
      // Only save if a userId is present (which will be the anonymous ID)
      const userSpecificStorageKey = `${LOCAL_STORAGE_KEY}_${state.userId}`;
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

  useEffect(() => {
    const loadInitialData = async () => {
      if (state.isInitialDataLoaded) return; // Prevent re-loading if already done

      dispatch({ type: 'SET_LOADING', payload: true });
      console.log("AppProvider: Loading initial data (anonymous)...");

      let userId = localStorage.getItem('app_user_id_vLocal_anon');
      if (!userId) {
        userId = `anon_${uuidv4()}`;
        localStorage.setItem('app_user_id_vLocal_anon', userId);
        console.log("AppProvider: Generated new anonymous user ID:", userId);
      } else {
        console.log("AppProvider: Found existing anonymous user ID:", userId);
      }

      let loadedStateFromStorage: Partial<Omit<AppState, 'isLoading' | 'isInitialDataLoaded' | 'userId' | 'supportedCurrencies'>> = {};
      const userSpecificStorageKey = `${LOCAL_STORAGE_KEY}_${userId}`;
      const storedStateRaw = localStorage.getItem(userSpecificStorageKey);

      if (storedStateRaw) {
        try {
          loadedStateFromStorage = JSON.parse(storedStateRaw);
          console.log("AppProvider: Loaded state from localStorage for user:", userId);
        } catch (e) {
          console.error("AppProvider: Failed to parse stored state, resetting for user:", userId, e);
          localStorage.removeItem(userSpecificStorageKey); // Clear corrupted state
        }
      } else {
        console.log("AppProvider: No saved state found in localStorage for user:", userId);
      }

      let currencyToSet = defaultCurrency;
      let allSupportedCurrencies: Currency[] = [defaultCurrency]; // Default to an array with the default currency

      if (loadedStateFromStorage.currency) {
        currencyToSet = loadedStateFromStorage.currency;
      } else {
        try {
          const detectedCurrency = await getUserCurrency(); // This is async
          if (detectedCurrency) {
            currencyToSet = detectedCurrency;
            console.log("AppProvider: Currency auto-detected:", currencyToSet);
          } else {
            console.log("AppProvider: Currency auto-detection failed, using default USD.");
          }
        } catch (e) {
          console.error("AppProvider: Currency auto-detection failed:", e);
        }
      }
      
      try {
        const fetchedCurrencies = await getSupportedCurrencies(); // This is async
        if (Array.isArray(fetchedCurrencies) && fetchedCurrencies.length > 0) {
          allSupportedCurrencies = fetchedCurrencies;
        } else {
          console.warn("AppProvider: getSupportedCurrencies did not return a valid array, using default.");
        }
      } catch (e) {
        console.error("AppProvider: Failed to fetch supported currencies list:", e);
      }

      // Prepare the payload for LOAD_STATE
      // Ensure all properties expected by AppState (except isLoading/isInitialDataLoaded) are present
      const finalPayload = {
        userId: userId, // The anonymous user ID
        currency: currencyToSet,
        lists: (loadedStateFromStorage.lists || []).filter(l => l.userId === userId), // Ensure lists are for this anonymous user
        selectedListId: loadedStateFromStorage.selectedListId || null,
        shoppingListItems: (loadedStateFromStorage.shoppingListItems || []).filter(i => i.userId === userId),
        categories: loadedStateFromStorage.categories, // Reducer will merge with defaults
        theme: loadedStateFromStorage.theme || defaultThemeId,
        supportedCurrencies: allSupportedCurrencies,
      };
      
      dispatch({ type: 'LOAD_STATE', payload: finalPayload });
      // isLoading and isInitialDataLoaded are set by the LOAD_STATE action
      console.log("AppProvider: Initial data processing finished. Current user ID in context:", userId);
    };

    loadInitialData();
  }, [state.isInitialDataLoaded]); // Rerun if isInitialDataLoaded changes, e.g. after logout a full reload might reset this.

  const formatCurrency = useCallback((amount: number) => {
    try {
      return new Intl.NumberFormat(undefined, { // Use user's locale for formatting
        style: 'currency',
        currency: state.currency.code,
      }).format(amount);
    } catch (error) {
      console.warn("Currency formatting error for code:", state.currency.code, error);
      return `${state.currency.symbol || '$'}${amount.toFixed(2)}`; // Fallback
    }
  }, [state.currency]);

  return (
    <AppContext.Provider value={{ state, dispatch, formatCurrency }}>
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
