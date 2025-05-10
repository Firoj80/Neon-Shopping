// src/context/app-context.tsx
"use client";

import React, { createContext, useContext, useReducer, useEffect, useState, useCallback } from 'react';
import { format, startOfDay, isSameDay } from 'date-fns';
import { themes, defaultThemeId } from '@/config/themes';
import { v4 as uuidv4 } from 'uuid';
import { getUserCurrency, type Currency, defaultCurrency } from '@/services/currency';
// Removed fetchFromApi import

const LOCAL_STORAGE_KEY = 'neonShoppingState_v4_local'; // New key to ensure fresh start
export const FREEMIUM_LIST_LIMIT = 3; // This might be used for UI display even without premium logic

export interface ShoppingListItem {
  id: string;
  listId: string; // Which list this item belongs to
  userId: string; // To associate with a user (even anonymous)
  name: string;
  quantity: number;
  price: number;
  category: string; // Category ID
  checked: boolean;
  dateAdded: number; // Timestamp
}

export interface List {
  id: string;
  userId: string; // Which user this list belongs to
  name: string;
  budgetLimit: number;
  defaultCategory?: string; // Optional default category for this list
}

export interface Category {
  id: string;
  name: string;
  userId?: string; // User who created it, or null/undefined for default
}

export interface BudgetItem {
  // This structure seems more related to overall budget, not list-specific
  // If budget is per list, it should be part of the List interface.
  // For now, keeping it simple for daily budget tracking if that's the intent
  dailyLimit: number;
  spentToday: number; // Calculated from checked items today
  lastSetDate: string | null; // YYYY-MM-DD
}

export interface AppState {
  userId: string | null; // Can be anonymous UUID or null if not set yet
  currency: Currency;
  theme: string; // Theme ID
  lists: List[];
  selectedListId: string | null;
  shoppingListItems: ShoppingListItem[];
  categories: Category[];
  budget: BudgetItem; // Overall daily budget (if this is the intent)
  isPremium: boolean; // Keep for UI display, but no functional enforcement
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'grocery', name: 'Grocery' },
  { id: 'home', name: 'Home Appliances' },
  { id: 'health', name: 'Health' },
  { id: 'electronics', name: 'Electronics' },
  { id: 'fashion', name: 'Fashion' },
  { id: 'uncategorized', name: 'Uncategorized' },
];

const initialState: AppState = {
  userId: null,
  currency: defaultCurrency, // Default currency
  theme: defaultThemeId,
  lists: [],
  selectedListId: null,
  shoppingListItems: [],
  categories: DEFAULT_CATEGORIES,
  budget: { dailyLimit: 0, spentToday: 0, lastSetDate: null },
  isPremium: false, // Default to false, UI might show premium features as locked
};

type Action =
  | { type: 'LOAD_STATE'; payload: Partial<AppState> }
  | { type: 'SET_USER_ID'; payload: string | null }
  | { type: 'SET_CURRENCY'; payload: Currency }
  | { type: 'SET_THEME'; payload: string }
  | { type: 'ADD_LIST'; payload: List }
  | { type: 'UPDATE_LIST'; payload: List }
  | { type: 'DELETE_LIST'; payload: string } // listId
  | { type: 'SELECT_LIST'; payload: string | null } // listId or null
  | { type: 'ADD_SHOPPING_ITEM'; payload: ShoppingListItem }
  | { type: 'UPDATE_SHOPPING_ITEM'; payload: ShoppingListItem }
  | { type: 'DELETE_SHOPPING_ITEM'; payload: string } // itemId
  | { type: 'TOGGLE_ITEM_CHECKED'; payload: string } // itemId
  | { type: 'SET_BUDGET'; payload: { dailyLimit: number } }
  | { type: 'ADD_CATEGORY'; payload: Category }
  | { type: 'UPDATE_CATEGORY'; payload: Category }
  | { type: 'DELETE_CATEGORY'; payload: string } // categoryId
  | { type: 'SET_PREMIUM_STATUS'; payload: boolean };

function appReducer(state: AppState, action: Action): AppState {
  let newState = state;
  switch (action.type) {
    case 'LOAD_STATE':
      newState = { ...state, ...action.payload, userId: action.payload.userId || state.userId || `anon_${uuidv4()}` };
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
        lists: state.lists.map(list =>
          list.id === action.payload.id ? action.payload : list
        ),
      };
      break;
    case 'DELETE_LIST':
      const listIdToDelete = action.payload;
      const newLists = state.lists.filter(list => list.id !== listIdToDelete);
      const newItems = state.shoppingListItems.filter(item => item.listId !== listIdToDelete);
      let newSelectedListId = state.selectedListId;
      if (state.selectedListId === listIdToDelete) {
        newSelectedListId = newLists.length > 0 ? newLists[0].id : null;
      }
      newState = {
        ...state,
        lists: newLists,
        shoppingListItems: newItems,
        selectedListId: newSelectedListId,
      };
      break;
    case 'SELECT_LIST':
      newState = { ...state, selectedListId: action.payload };
      break;
    case 'ADD_SHOPPING_ITEM':
      if (!action.payload.listId || !action.payload.userId) {
         console.error("Attempted to add item without listId or userId. Item:", action.payload);
        return state; // Prevent adding item without necessary IDs
      }
      newState = {
        ...state,
        shoppingListItems: [...state.shoppingListItems, action.payload],
      };
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
        shoppingListItems: state.shoppingListItems.filter(
          item => item.id !== action.payload
        ),
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
    case 'SET_BUDGET':
      // This budget seems global daily, not per list.
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      newState = {
        ...state,
        budget: {
          ...state.budget,
          dailyLimit: action.payload.dailyLimit,
          lastSetDate: todayStr,
        },
      };
      break;
    case 'ADD_CATEGORY':
      newState = { ...state, categories: [...state.categories, action.payload] };
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
      // Reassign items from deleted category to 'uncategorized'
      const updatedItems = state.shoppingListItems.map(item =>
        item.category === categoryIdToDelete ? { ...item, category: 'uncategorized' } : item
      );
      newState = {
        ...state,
        categories: state.categories.filter(cat => cat.id !== categoryIdToDelete),
        shoppingListItems: updatedItems,
      };
      break;
    case 'SET_PREMIUM_STATUS': // Kept for UI consistency, but not enforced
      newState = { ...state, isPremium: action.payload };
      break;
    default:
      newState = state;
  }

  // Update budget.spentToday after any relevant item change
  if (['ADD_SHOPPING_ITEM', 'UPDATE_SHOPPING_ITEM', 'DELETE_SHOPPING_ITEM', 'TOGGLE_ITEM_CHECKED', 'LOAD_STATE'].includes(action.type)) {
    const today = startOfDay(new Date());
    const spentToday = newState.shoppingListItems.reduce((total, item) => {
      if (item.checked && item.dateAdded && isSameDay(new Date(item.dateAdded), today)) {
        return total + item.price * item.quantity;
      }
      return total;
    }, 0);
    newState = { ...newState, budget: { ...newState.budget, spentToday } };
  }
  
  // Save to localStorage on every state change except initial load
  if (action.type !== 'LOAD_STATE' && typeof window !== 'undefined') {
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
  isLoading: boolean; // For initial data load
  isInitialDataLoaded: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [isLoading, setIsLoading] = useState(true); // Loading initial data
  const [isInitialDataLoaded, setIsInitialDataLoaded] = useState(false);

  useEffect(() => {
    const loadInitialData = async () => {
      if (isInitialDataLoaded) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      console.log("AppProvider: Loading initial data (localStorage)...");

      let userId = localStorage.getItem('app_user_id'); // Use a distinct key for anonymous user
      if (!userId) {
        userId = `anon_${uuidv4()}`;
        localStorage.setItem('app_user_id', userId);
        console.log("AppProvider: No user ID found, generated anonymous ID:", userId);
      } else {
        console.log("AppProvider: Found anonymous user ID:", userId);
      }

      let loadedStateFromStorage: Partial<AppState> = { userId }; // Start with userId

      try {
        const savedStateRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedStateRaw) {
          const parsedState = JSON.parse(savedStateRaw);
          // Ensure the loaded state also gets the correct userId if it was just generated
          loadedStateFromStorage = { ...parsedState, userId: parsedState.userId || userId }; 
          console.log("AppProvider: Loaded state from localStorage:", loadedStateFromStorage);
        } else {
          console.log("AppProvider: No state found in localStorage, using defaults.");
        }
      } catch (error) {
        console.error("AppProvider: Failed to parse state from localStorage, using defaults.", error);
      }
      
      // Auto-detect currency if not already set in loaded state
      if (!loadedStateFromStorage.currency) {
        try {
          console.log("AppProvider: Attempting to auto-detect currency...");
          const detectedCurrency = await getUserCurrency();
          if (detectedCurrency) {
            loadedStateFromStorage.currency = detectedCurrency;
            console.log("AppProvider: Currency auto-detected:", detectedCurrency.code);
          } else {
            loadedStateFromStorage.currency = defaultCurrency;
            console.log("AppProvider: Currency auto-detection failed, using default:", defaultCurrency.code);
          }
        } catch (error) {
          console.error("AppProvider: Error during currency auto-detection:", error);
          loadedStateFromStorage.currency = defaultCurrency;
        }
      } else {
         console.log("AppProvider: Using currency from localStorage:", loadedStateFromStorage.currency.code);
      }


      dispatch({ type: 'LOAD_STATE', payload: loadedStateFromStorage });
      setIsInitialDataLoaded(true);
      setIsLoading(false);
      console.log("AppProvider: Initial data processing finished. Current user ID in context:", (loadedStateFromStorage.userId || userId));
    };

    loadInitialData();
  }, [isInitialDataLoaded]); // Only run once on mount effectively

  return (
    <AppContext.Provider value={{ state, dispatch, isLoading, isInitialDataLoaded }}>
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
