
"use client";

import React, { createContext, useContext, useReducer, useEffect, useState, useCallback, type ReactNode } from 'react';
import { format, startOfDay, isSameDay } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import type { Currency } from '@/services/currency';
import { getUserCurrency, getSupportedCurrencies } from '@/services/currency';
import { defaultThemeId } from '@/config/themes';

// --- Types ---
export interface ShoppingListItem {
  id: string;
  userId: string; // To associate item with a user (even anonymous)
  listId: string;
  name: string;
  quantity: number;
  price: number;
  category: string;
  checked: boolean;
  dateAdded: number; // Timestamp
}

export interface List {
  id: string;
  userId: string;
  name: string;
  budgetLimit: number;
  defaultCategory: string; // ID of the default category for this list
}

export interface Category {
  id: string;
  name: string;
  userId?: string; // Optional: if categories can be user-specific or global
}

export interface AppState {
  userId: string | null; // Can be null initially or for anonymous users
  isAuthenticated: boolean; // Added for clarity, managed by AuthContext primarily
  currency: Currency;
  lists: List[];
  selectedListId: string | null;
  shoppingListItems: ShoppingListItem[];
  categories: Category[];
  theme: string;
  isLoading: boolean; // Global loading state for initial data
}

// --- Initial State & Constants ---
const LOCAL_STORAGE_KEY = 'neonShoppingAppState';
const defaultCurrency: Currency = { code: 'USD', symbol: '$', name: 'US Dollar' };
export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'uncategorized', name: 'Uncategorized' },
  { id: 'grocery', name: 'Grocery' },
  { id: 'home', name: 'Home' },
  { id: 'health', name: 'Health' },
  { id: 'electronics', name: 'Electronics' },
  { id: 'sports', name: 'Sports' },
];

const initialState: AppState = {
  userId: null,
  isAuthenticated: false,
  currency: defaultCurrency,
  lists: [],
  selectedListId: null,
  shoppingListItems: [],
  categories: DEFAULT_CATEGORIES,
  theme: defaultThemeId,
  isLoading: true,
};

// --- Context ---
interface AppContextProps {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  formatCurrency: (amount: number) => string;
  isLoading: boolean; // Expose loading state directly
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

// --- Actions ---
type Action =
  | { type: 'LOAD_STATE'; payload: Partial<AppState> }
  | { type: 'SET_USER_ID'; payload: string | null }
  | { type: 'SET_CURRENCY'; payload: Currency }
  | { type: 'ADD_LIST'; payload: Omit<List, 'id' | 'userId'> }
  | { type: 'UPDATE_LIST'; payload: List }
  | { type: 'DELETE_LIST'; payload: string }
  | { type: 'SELECT_LIST'; payload: string | null }
  | { type: 'ADD_SHOPPING_ITEM'; payload: Omit<ShoppingListItem, 'id' | 'dateAdded' | 'checked'> }
  | { type: 'UPDATE_SHOPPING_ITEM'; payload: ShoppingListItem }
  | { type: 'REMOVE_SHOPPING_ITEM'; payload: string }
  | { type: 'TOGGLE_SHOPPING_ITEM'; payload: string }
  | { type: 'ADD_CATEGORY'; payload: { name: string } }
  | { type: 'UPDATE_CATEGORY'; payload: Category }
  | { type: 'REMOVE_CATEGORY'; payload: { categoryId: string; reassignToId?: string } }
  | { type: 'SET_THEME'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean };


// --- Reducer ---
function appReducer(state: AppState, action: Action): AppState {
  let newState = { ...state };

  switch (action.type) {
    case 'LOAD_STATE':
      newState = { ...state, ...action.payload, isLoading: false };
      break;
    case 'SET_USER_ID':
      newState = { ...state, userId: action.payload };
      break;
    case 'SET_CURRENCY':
      newState = { ...state, currency: action.payload };
      break;
    case 'ADD_LIST': {
      if (!state.userId) {
        console.error("Cannot add list: User ID is not set.");
        return state; // Or handle as an error appropriately
      }
      const newList: List = {
        id: uuidv4(),
        userId: state.userId,
        ...action.payload,
      };
      newState.lists = [...state.lists, newList];
      if (newState.lists.length === 1) { // Auto-select if it's the first list
        newState.selectedListId = newList.id;
      }
      break;
    }
    case 'UPDATE_LIST':
      newState.lists = state.lists.map(list =>
        list.id === action.payload.id ? action.payload : list
      );
      break;
    case 'DELETE_LIST':
      newState.lists = state.lists.filter(list => list.id !== action.payload);
      newState.shoppingListItems = state.shoppingListItems.filter(item => item.listId !== action.payload);
      if (state.selectedListId === action.payload) {
        newState.selectedListId = newState.lists.length > 0 ? newState.lists[0].id : null;
      }
      break;
    case 'SELECT_LIST':
      newState.selectedListId = action.payload;
      break;
    case 'ADD_SHOPPING_ITEM': {
      if (!action.payload.listId || !action.payload.userId) {
        console.error("Attempted to add item without listId or userId", action.payload);
        return state;
      }
      const newItem: ShoppingListItem = {
        id: uuidv4(),
        dateAdded: Date.now(),
        checked: false,
        ...action.payload,
      };
      newState.shoppingListItems = [...state.shoppingListItems, newItem];
      break;
    }
    case 'UPDATE_SHOPPING_ITEM':
      newState.shoppingListItems = state.shoppingListItems.map(item =>
        item.id === action.payload.id ? action.payload : item
      );
      break;
    case 'REMOVE_SHOPPING_ITEM':
      newState.shoppingListItems = state.shoppingListItems.filter(
        item => item.id !== action.payload
      );
      break;
    case 'TOGGLE_SHOPPING_ITEM':
      newState.shoppingListItems = state.shoppingListItems.map(item =>
        item.id === action.payload ? { ...item, checked: !item.checked, dateAdded: Date.now() } : item // Update dateAdded on toggle for history/stats
      );
      break;
    case 'ADD_CATEGORY': {
      const newCategory: Category = {
        id: uuidv4(),
        name: action.payload.name,
        userId: state.userId || undefined, // Associate with user if available
      };
      newState.categories = [...state.categories, newCategory];
      break;
    }
    case 'UPDATE_CATEGORY':
      newState.categories = state.categories.map(cat =>
        cat.id === action.payload.id ? action.payload : cat
      );
      break;
    case 'REMOVE_CATEGORY': {
      const { categoryId, reassignToId } = action.payload;
      newState.categories = state.categories.filter(cat => cat.id !== categoryId);
      // Reassign items from the deleted category
      if (reassignToId) {
        newState.shoppingListItems = state.shoppingListItems.map(item =>
          item.category === categoryId ? { ...item, category: reassignToId } : item
        );
      } else { // If no reassignToId, mark as uncategorized (if 'uncategorized' exists)
          const uncategorized = newState.categories.find(c => c.id === 'uncategorized' || c.name.toLowerCase() === 'uncategorized');
          if (uncategorized) {
            newState.shoppingListItems = state.shoppingListItems.map(item =>
                item.category === categoryId ? { ...item, category: uncategorized.id } : item
            );
          }
      }
      break;
    }
    case 'SET_THEME':
      newState = { ...state, theme: action.payload };
      break;
    case 'SET_LOADING':
      newState = { ...state, isLoading: action.payload };
      break;
    default:
      return state;
  }

  // Save to localStorage after every relevant action
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newState));
    } catch (error) {
      console.error("Failed to save state to localStorage:", error);
    }
  }

  return newState;
}

// --- Provider Component ---
export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [isLoading, setIsLoading] = useState(true); // Local loading state for this provider

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true); // Start loading
      let loadedStateFromStorage: Partial<AppState> = {};
      let anonymousUserId: string | null = null;

      if (typeof window !== 'undefined') {
        try {
          anonymousUserId = localStorage.getItem('app_user_id');
          if (!anonymousUserId) {
            anonymousUserId = uuidv4();
            localStorage.setItem('app_user_id', anonymousUserId);
          }

          const savedStateRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (savedStateRaw) {
            loadedStateFromStorage = JSON.parse(savedStateRaw);
          }
        } catch (e) {
          console.error("Failed to parse saved state or handle user ID, resetting:", e);
          localStorage.removeItem(LOCAL_STORAGE_KEY); // Clear potentially corrupted state
          localStorage.removeItem('app_user_id'); // Clear potentially corrupted user ID
          anonymousUserId = uuidv4(); // Generate a fresh one
          localStorage.setItem('app_user_id', anonymousUserId);
        }

        let finalCurrency = loadedStateFromStorage.currency || defaultCurrency;
        if (!loadedStateFromStorage.currency) { // Only auto-detect if no currency is saved
            try {
                const detectedCurrency = await getUserCurrency();
                if (detectedCurrency) {
                    finalCurrency = detectedCurrency;
                    console.log("Currency auto-detected:", detectedCurrency);
                } else {
                    console.log("Currency auto-detection failed, using default.");
                }
            } catch (e) {
                console.error("Error during currency auto-detection:", e);
            }
        }


        dispatch({
          type: 'LOAD_STATE',
          payload: {
            ...initialState, // Start with defaults
            ...loadedStateFromStorage, // Override with saved state
            userId: loadedStateFromStorage.userId || anonymousUserId, // Prioritize loaded user ID
            currency: finalCurrency, // Use resolved currency
            isLoading: false, // Initial load done
            // Ensure lists, items, categories are arrays if not present in loadedState
            lists: loadedStateFromStorage.lists || [],
            shoppingListItems: loadedStateFromStorage.shoppingListItems || [],
            categories: loadedStateFromStorage.categories && loadedStateFromStorage.categories.length > 0 ? loadedStateFromStorage.categories : DEFAULT_CATEGORIES,
            selectedListId: loadedStateFromStorage.selectedListId || ( (loadedStateFromStorage.lists && loadedStateFromStorage.lists.length > 0) ? loadedStateFromStorage.lists[0].id : null),
            theme: loadedStateFromStorage.theme || defaultThemeId,
          },
        });
      }
      setIsLoading(false); // End loading
    };
    loadInitialData();
  }, []);


  const formatCurrency = useCallback(
    (amount: number) => {
      try {
        return new Intl.NumberFormat(undefined, { // Use user's locale
          style: 'currency',
          currency: state.currency.code,
        }).format(amount);
      } catch (error) {
        // Fallback if Intl or currency code is problematic
        console.warn("Currency formatting error, using fallback:", error);
        return `${state.currency.symbol}${amount.toFixed(2)}`;
      }
    },
    [state.currency]
  );

  return (
    <AppContext.Provider value={{ state, dispatch, formatCurrency, isLoading: state.isLoading }}>
      {children}
    </AppContext.Provider>
  );
};

// --- Hook ---
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
