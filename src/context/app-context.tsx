"use client";

import React, { createContext, useContext, useReducer, useEffect, useState, useCallback } from 'react';
import { format, startOfDay, isSameDay } from 'date-fns';
import { themes, defaultThemeId, type Theme } from '@/config/themes';
import { v4 as uuidv4 } from 'uuid';
import { getUserCurrency, type Currency, defaultCurrency, समर्थितमुद्राएँ } from '@/services/currency';

const LOCAL_STORAGE_KEY = 'neonShoppingState_vLocal'; // Key for local storage
export const FREEMIUM_LIST_LIMIT = 3; // This can be used for UI display or future freemium features

// --- Types ---
export interface ShoppingListItem {
  id: string;
  listId: string;
  userId: string; // Anonymous user ID
  name: string;
  quantity: number;
  price: number;
  category: string; // Category ID
  checked: boolean;
  dateAdded: number; // Timestamp
}

export interface List {
  id: string;
  userId: string; // Anonymous user ID
  name: string;
  budgetLimit: number;
  defaultCategory?: string;
}

export interface Category {
  id: string;
  name: string;
  userId?: string; // Optional: if categories are user-specific (even for anonymous users)
}

export interface AppState {
  userId: string | null; // Anonymous UUID
  currency: Currency;
  theme: string; // Theme ID
  lists: List[];
  selectedListId: string | null;
  shoppingListItems: ShoppingListItem[];
  categories: Category[];
  isPremium: boolean; // Will be false as premium features are removed
  isInitialDataLoaded: boolean; // Tracks if initial data load from localStorage is complete
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'grocery', name: 'Grocery' },
  { id: 'home', name: 'Home Appliances' },
  { id: 'health', name: 'Health' },
  { id: 'electronics', name: 'Electronics' },
  { id: 'fashion', name: 'Fashion' },
  { id: 'sports', name: 'Sports'},
  { id: 'uncategorized', name: 'Uncategorized' },
];

const initialState: AppState = {
  userId: null,
  currency: defaultCurrency,
  theme: defaultThemeId,
  lists: [],
  selectedListId: null,
  shoppingListItems: [],
  categories: DEFAULT_CATEGORIES,
  isPremium: false, // Always false now
  isInitialDataLoaded: false,
};

// --- Actions ---
type Action =
  | { type: 'LOAD_STATE'; payload: Partial<AppState> }
  | { type: 'SET_USER_ID'; payload: string | null }
  | { type: 'SET_CURRENCY'; payload: Currency }
  | { type: 'SET_THEME'; payload: string }
  | { type: 'ADD_LIST'; payload: List }
  | { type: 'UPDATE_LIST'; payload: List }
  | { type: 'DELETE_LIST'; payload: string }
  | { type: 'SELECT_LIST'; payload: string | null }
  | { type: 'ADD_SHOPPING_ITEM'; payload: ShoppingListItem }
  | { type: 'UPDATE_SHOPPING_ITEM'; payload: ShoppingListItem }
  | { type: 'DELETE_SHOPPING_ITEM'; payload: string }
  | { type: 'TOGGLE_ITEM_CHECKED'; payload: string }
  | { type: 'ADD_CATEGORY'; payload: Category }
  | { type: 'UPDATE_CATEGORY'; payload: Category }
  | { type: 'DELETE_CATEGORY'; payload: string }
  | { type: 'SET_PREMIUM_STATUS'; payload: boolean } // Kept for type safety, but value will be false
  | { type: 'SET_INITIAL_DATA_LOADED'; payload: boolean };


// --- Reducer ---
function appReducer(state: AppState, action: Action): AppState {
  let newState = { ...state };

  switch (action.type) {
    case 'LOAD_STATE':
      newState = { ...state, ...action.payload, userId: action.payload.userId || state.userId };
      break;
    case 'SET_USER_ID':
      newState = { ...state, userId: action.payload };
      break;
    case 'SET_CURRENCY':
      newState = { ...state, currency: action.payload };
      break;
    case 'SET_THEME':
      newState = { ...state, theme: action.payload };
      break;
    case 'ADD_LIST':
      newState = { ...state, lists: [...state.lists, action.payload] };
      break;
    case 'UPDATE_LIST':
      newState = {
        ...state,
        lists: state.lists.map(list => list.id === action.payload.id ? action.payload : list),
      };
      break;
    case 'DELETE_LIST':
      const listIdToDelete = action.payload;
      const remainingLists = state.lists.filter(list => list.id !== listIdToDelete);
      newState = {
        ...state,
        lists: remainingLists,
        shoppingListItems: state.shoppingListItems.filter(item => item.listId !== listIdToDelete),
        selectedListId: state.selectedListId === listIdToDelete
          ? (remainingLists.length > 0 ? remainingLists[0].id : null)
          : state.selectedListId,
      };
      break;
    case 'SELECT_LIST':
      newState = { ...state, selectedListId: action.payload };
      break;
    case 'ADD_SHOPPING_ITEM':
      if (!action.payload.listId || !action.payload.userId) {
        console.error("Attempted to add item without listId or userId:", action.payload);
        return state;
      }
      newState = { ...state, shoppingListItems: [...state.shoppingListItems, action.payload] };
      break;
    case 'UPDATE_SHOPPING_ITEM':
      newState = {
        ...state,
        shoppingListItems: state.shoppingListItems.map(item =>
          item.id === action.payload.id ? action.payload : item
        ),
      };
      break;
    case 'DELETE_SHOPPING_ITEM':
      newState = {
        ...state,
        shoppingListItems: state.shoppingListItems.filter(item => item.id !== action.payload),
      };
      break;
    case 'TOGGLE_ITEM_CHECKED':
      newState = {
        ...state,
        shoppingListItems: state.shoppingListItems.map(item =>
          item.id === action.payload ? { ...item, checked: !item.checked } : item
        ),
      };
      break;
    case 'ADD_CATEGORY':
      if (!state.categories.find(cat => cat.name.toLowerCase() === action.payload.name.toLowerCase())) {
        newState = { ...state, categories: [...state.categories, action.payload] };
      }
      break;
    case 'UPDATE_CATEGORY':
      newState = {
        ...state,
        categories: state.categories.map(cat =>
          cat.id === action.payload.id ? action.payload : cat
        ),
      };
      break;
    case 'DELETE_CATEGORY':
      const categoryIdToDelete = action.payload;
      const uncategorized = state.categories.find(c => c.id === 'uncategorized');
      const targetCategoryId = uncategorized ? 'uncategorized' : (state.categories.find(c => c.id !== categoryIdToDelete)?.id || null);

      newState = {
        ...state,
        categories: state.categories.filter(cat => cat.id !== categoryIdToDelete),
        shoppingListItems: state.shoppingListItems.map(item =>
          item.category === categoryIdToDelete
            ? { ...item, category: targetCategoryId || 'uncategorized' } 
            : item
        ),
      };
      newState.lists = newState.lists.map(list => 
        list.defaultCategory === categoryIdToDelete 
        ? { ...list, defaultCategory: targetCategoryId || undefined } 
        : list
      );
      break;
    case 'SET_PREMIUM_STATUS':
      newState = { ...state, isPremium: false }; // Always false
      break;
    case 'SET_INITIAL_DATA_LOADED':
      newState = { ...state, isInitialDataLoaded: action.payload };
      break;
    default:
      break;
  }

  if (action.type !== 'LOAD_STATE' && action.type !== 'SET_INITIAL_DATA_LOADED' && typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newState));
    } catch (error) {
      console.error("Failed to save state to localStorage:", error);
    }
  }
  return newState;
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  isLoading: boolean; 
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadInitialData = async () => {
      if (state.isInitialDataLoaded) {
         setIsLoading(false);
         return;
      }
      
      console.log("AppProvider: Loading initial data (localStorage)...");
      setIsLoading(true);

      let userId = localStorage.getItem('app_user_id'); 
      if (!userId) {
        userId = `anon_${uuidv4()}`;
        localStorage.setItem('app_user_id', userId);
      }

      let loadedStateFromStorage: Partial<AppState> = { userId };

      try {
        const savedStateRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedStateRaw) {
          const parsedState = JSON.parse(savedStateRaw);
          loadedStateFromStorage = { ...parsedState, userId: parsedState.userId || userId };
        }
      } catch (error) {
        console.error("AppProvider: Failed to parse state from localStorage, using defaults.", error);
      }

      if (!loadedStateFromStorage.currency) {
        try {
          const detectedCurrency = await getUserCurrency();
          loadedStateFromStorage.currency = detectedCurrency || defaultCurrency;
        } catch (error) {
          console.error("AppProvider: Error during currency auto-detection:", error);
          loadedStateFromStorage.currency = defaultCurrency;
        }
      }
      
      const finalCategories = (loadedStateFromStorage.categories && loadedStateFromStorage.categories.length > 0)
        ? loadedStateFromStorage.categories
        : DEFAULT_CATEGORIES;
      loadedStateFromStorage.categories = finalCategories;

      if (!loadedStateFromStorage.lists) loadedStateFromStorage.lists = [];
      if (!loadedStateFromStorage.shoppingListItems) loadedStateFromStorage.shoppingListItems = [];
      if (!loadedStateFromStorage.selectedListId && loadedStateFromStorage.lists.length > 0) {
        loadedStateFromStorage.selectedListId = loadedStateFromStorage.lists[0].id;
      }

      dispatch({ type: 'LOAD_STATE', payload: loadedStateFromStorage });
      dispatch({ type: 'SET_INITIAL_DATA_LOADED', payload: true });
      setIsLoading(false);
      console.log("AppProvider: Initial data processing finished. Current user ID in context:", (loadedStateFromStorage.userId));
    };

    loadInitialData();
  }, [state.isInitialDataLoaded]);

  return (
    <AppContext.Provider value={{ state, dispatch, isLoading }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
