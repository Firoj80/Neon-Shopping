// src/context/app-context.tsx
"use client";

import React, { createContext, useContext, useReducer, useEffect, useState, useCallback, type ReactNode } from 'react';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { getUserCurrency, type Currency } from '@/services/currency';
// fetchFromApi might still be used for currency detection or other non-auth external calls
import { fetchFromApi } from '@/lib/api'; 

const LOCAL_STORAGE_KEY = 'neonShoppingState_v4_anon'; // Key for anonymous user data
export const FREEMIUM_LIST_LIMIT = 3; // This limit might apply to all users now
export const FREEMIUM_CATEGORY_LIMIT = 5; // This limit might apply to all users now

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'uncategorized', name: 'Uncategorized', userId: null }, // userId null for global
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
  userId: string; // Will be the app_user_id
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
  userId: string | null; // null for default, app_user_id for custom
}

export interface List {
  id: string;
  userId: string; // Will be the app_user_id
  name: string;
  budgetLimit: number;
  defaultCategory: string;
}

interface AppState {
  userId: string; // Now always the app_user_id
  currency: Currency;
  lists: List[];
  selectedListId: string | null;
  shoppingListItems: ShoppingListItem[];
  categories: Category[];
  isLoading: boolean;
  isInitialDataLoaded: boolean;
  theme: string; // Keep theme
}

interface AppContextProps {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  formatCurrency: (amount: number) => string;
  isLoading: boolean;
}

const defaultCurrency: Currency = { code: 'USD', symbol: '$', name: 'US Dollar' };
const defaultThemeId = 'cyberpunk-cyan'; // Default theme

const initialState: AppState = {
  userId: '', // Will be set to app_user_id on load
  currency: defaultCurrency,
  lists: [],
  selectedListId: null,
  shoppingListItems: [],
  categories: [...DEFAULT_CATEGORIES],
  isLoading: true,
  isInitialDataLoaded: false,
  theme: defaultThemeId,
};

type Action =
  | { type: 'LOAD_STATE'; payload: Partial<AppState> & { userId: string } }
  | { type: 'SET_CURRENCY'; payload: Currency }
  | { type: 'ADD_LIST'; payload: Omit<List, 'userId'> } // userId will be added in reducer
  | { type: 'UPDATE_LIST'; payload: List }
  | { type: 'DELETE_LIST'; payload: string }
  | { type: 'SELECT_LIST'; payload: string | null }
  | { type: 'ADD_SHOPPING_ITEM'; payload: Omit<ShoppingListItem, 'userId'> } // userId will be added
  | { type: 'UPDATE_SHOPPING_ITEM'; payload: ShoppingListItem }
  | { type: 'REMOVE_SHOPPING_ITEM'; payload: string }
  | { type: 'TOGGLE_SHOPPING_ITEM'; payload: string }
  | { type: 'ADD_CATEGORY'; payload: { name: string } }
  | { type: 'UPDATE_CATEGORY'; payload: { id: string; name: string } }
  | { type: 'REMOVE_CATEGORY'; payload: { categoryId: string; reassignToId?: string } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_THEME'; payload: string };
  // Removed SET_PREMIUM_STATUS and backend related actions


const mergeCategories = (defaultCats: Category[], storedCats: Category[], currentUserId: string): Category[] => {
  const categoryMap = new Map<string, Category>();
  defaultCats.forEach(cat => categoryMap.set(cat.id, { ...cat, userId: null }));
  storedCats.forEach(cat => {
    // User-specific categories from storage should be associated with the current app_user_id
    // Or if they were somehow stored with userId: null, keep them as global
    categoryMap.set(cat.id, { ...cat, userId: cat.userId === null ? null : currentUserId });
  });
  return Array.from(categoryMap.values());
};

function appReducer(state: AppState, action: Action): AppState {
  let newState = { ...state };

  switch (action.type) {
    case 'LOAD_STATE': {
      const { userId: loadedUserId, ...restOfPayload } = action.payload;
      newState = {
        ...initialState, // Start from a clean default state
        ...restOfPayload, // Overlay loaded data
        userId: loadedUserId, // Crucial: use the provided userId
        currency: restOfPayload.currency || initialState.currency,
        categories: mergeCategories(DEFAULT_CATEGORIES, restOfPayload.categories || [], loadedUserId),
        theme: restOfPayload.theme || initialState.theme,
        isLoading: false,
        isInitialDataLoaded: true,
      };
       // Ensure selectedListId is valid for the loaded lists and userId
      if (newState.lists && newState.lists.length > 0) {
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
    }
    case 'SET_CURRENCY':
      newState = { ...state, currency: action.payload };
      break;
    case 'ADD_LIST': {
      const newList: List = { ...action.payload, id: uuidv4(), userId: state.userId };
      newState.lists = [...state.lists, newList];
      if (!state.selectedListId) {
        newState.selectedListId = newList.id;
      }
      break;
    }
    case 'UPDATE_LIST':
      newState.lists = state.lists.map(list =>
        list.id === action.payload.id && list.userId === state.userId ? { ...action.payload, userId: state.userId } : list
      );
      break;
    case 'DELETE_LIST':
      newState.lists = state.lists.filter(list => !(list.id === action.payload && list.userId === state.userId));
      newState.shoppingListItems = state.shoppingListItems.filter(item => item.listId !== action.payload || item.userId !== state.userId);
      if (state.selectedListId === action.payload) {
        const userListsRemaining = newState.lists.filter(l => l.userId === state.userId);
        newState.selectedListId = userListsRemaining.length > 0 ? userListsRemaining[0].id : null;
      }
      break;
    case 'SELECT_LIST':
      // Ensure the selected list belongs to the current user
      const listToSelect = state.lists.find(l => l.id === action.payload && l.userId === state.userId);
      newState.selectedListId = listToSelect ? action.payload : state.selectedListId;
      break;
    case 'ADD_SHOPPING_ITEM': {
      const newItem: ShoppingListItem = { ...action.payload, id: uuidv4(), dateAdded: Date.now(), checked: false, userId: state.userId };
      newState.shoppingListItems = [...state.shoppingListItems, newItem];
      break;
    }
    case 'UPDATE_SHOPPING_ITEM':
      newState.shoppingListItems = state.shoppingListItems.map(item =>
        item.id === action.payload.id && item.userId === state.userId ? { ...action.payload, userId: state.userId } : item
      );
      break;
    case 'REMOVE_SHOPPING_ITEM':
      newState.shoppingListItems = state.shoppingListItems.filter(item => !(item.id === action.payload && item.userId === state.userId));
      break;
    case 'TOGGLE_SHOPPING_ITEM':
      newState.shoppingListItems = state.shoppingListItems.map(item =>
        item.id === action.payload && item.userId === state.userId ? { ...item, checked: !item.checked, dateAdded: Date.now() } : item
      );
      break;
    case 'ADD_CATEGORY': {
      const newCategory: Category = { id: uuidv4(), name: action.payload.name, userId: state.userId };
      newState.categories = [...state.categories, newCategory];
      break;
    }
    case 'UPDATE_CATEGORY':
       // Allow updating user-created categories or default categories (name only)
      newState.categories = state.categories.map(cat => {
        if (cat.id === action.payload.id) {
          if (cat.userId === state.userId || cat.userId === null) { // User owns it or it's a global default
            return { ...cat, name: action.payload.name };
          }
        }
        return cat;
      });
      break;
    case 'REMOVE_CATEGORY': {
      const catToRemove = state.categories.find(c => c.id === action.payload.categoryId);
      if (!catToRemove || catToRemove.id === 'uncategorized') break; // Cannot remove uncategorized
      
      // Allow deleting user-created categories or default categories
      if (catToRemove.userId === state.userId || catToRemove.userId === null) {
        newState.categories = state.categories.filter(cat => cat.id !== action.payload.categoryId);
        const reassignTo = action.payload.reassignToId || 'uncategorized';
        newState.shoppingListItems = state.shoppingListItems.map(item =>
          item.category === action.payload.categoryId && item.userId === state.userId ? { ...item, category: reassignTo } : item
        );
        newState.lists = state.lists.map(list =>
          list.defaultCategory === action.payload.categoryId && list.userId === state.userId ? { ...list, defaultCategory: reassignTo } : list
        );
      }
      break;
    }
    case 'SET_LOADING':
      newState = { ...state, isLoading: action.payload };
      break;
    case 'SET_THEME':
      newState = { ...state, theme: action.payload };
      break;
    default:
      newState = state;
  }

  // Persist state to localStorage on every relevant action
  if (newState.userId && typeof window !== 'undefined' && action.type !== 'LOAD_STATE' && action.type !== 'SET_LOADING') {
    try {
      const { isLoading: _omittedLoading, isInitialDataLoaded: _omittedInitial, ...stateToSave } = newState;
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_${newState.userId}`, JSON.stringify(stateToSave));
    } catch (error) {
      console.error("Failed to save state to localStorage:", error);
    }
  }
  return newState;
}

export const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [isLoading, setIsLoading] = useState(true); // Local loading state for initial setup
  const [isInitialDataLoaded, setIsInitialDataLoaded] = useState(false);


  useEffect(() => {
    const loadInitialData = async () => {
      if (isInitialDataLoaded) return; // Prevent re-running if already loaded

      setIsLoading(true);
      let userId = localStorage.getItem('app_user_id');
      if (!userId) {
        userId = `anon_${uuidv4()}`;
        localStorage.setItem('app_user_id', userId);
      }

      let loadedStateFromStorage: Partial<Omit<AppState, 'isLoading'|'isInitialDataLoaded'>> = {};
      const storageKey = `${LOCAL_STORAGE_KEY}_${userId}`;
      const storedStateRaw = localStorage.getItem(storageKey);

      if (storedStateRaw) {
        try {
          loadedStateFromStorage = JSON.parse(storedStateRaw);
        } catch (e) {
          console.error("Failed to parse stored state, resetting for user:", userId, e);
          localStorage.removeItem(storageKey); // Clear corrupted state
        }
      }
      
      let currencyToSet = loadedStateFromStorage.currency || defaultCurrency;
      if (!loadedStateFromStorage.currency) { // Only detect if no currency is stored
        try {
          const detectedCurrency = await getUserCurrency();
          if (detectedCurrency) {
            currencyToSet = detectedCurrency;
          }
        } catch (e) {
          console.error("Currency auto-detection failed:", e);
        }
      }

      dispatch({
        type: 'LOAD_STATE',
        payload: {
          ...initialState, // Start with defaults
          ...loadedStateFromStorage, // Overlay stored state
          userId: userId, // Ensure this is the current app_user_id
          currency: currencyToSet,
          theme: loadedStateFromStorage.theme || defaultThemeId,
          // categories will be merged in the reducer
        },
      });
      setIsInitialDataLoaded(true); // Mark initial data as loaded
      setIsLoading(false); // Local loading done
    };

    loadInitialData();
  }, [isInitialDataLoaded]); // Depend on isInitialDataLoaded

  const formatCurrency = useCallback((amount: number) => {
    try {
      return new Intl.NumberFormat(undefined, { // Use browser's default locale
        style: 'currency',
        currency: state.currency.code,
      }).format(amount);
    } catch (error) {
      console.warn("Currency formatting error for code:", state.currency.code, error);
      return `${state.currency.symbol || '$'}${amount.toFixed(2)}`;
    }
  }, [state.currency]);

  const combinedIsLoading = isLoading || state.isLoading; // Combine local loading with context loading

  return (
    <AppContext.Provider value={{ state, dispatch, formatCurrency, isLoading: combinedIsLoading }}>
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
