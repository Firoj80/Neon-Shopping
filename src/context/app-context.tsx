"use client";

import React, { createContext, useContext, useReducer, useEffect, useState, useCallback, type ReactNode } from 'react';
import { format, startOfDay, isSameDay } from 'date-fns';
import { v4 as uuidv4 } from 'uuid'; // Import UUID generator
import type { Currency } from '@/services/currency';
import { getUserCurrency, getSupportedCurrencies } from '@/services/currency';
import { defaultThemeId } from '@/config/themes';

// --- Types ---
export interface ShoppingListItem {
  id: string;
  userId: string;
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
  defaultCategory: string;
}

export interface Category {
  id: string;
  name: string;
  userId?: string;
}

export interface AppState {
  userId: string | null;
  currency: Currency;
  lists: List[];
  selectedListId: string | null;
  shoppingListItems: ShoppingListItem[];
  categories: Category[];
  theme: string;
  isLoading: boolean;
  isPremium: boolean; // Added for premium status
}

// --- Initial State & Constants ---
const LOCAL_STORAGE_KEY = 'neonShoppingAppState';
const USER_ID_KEY = 'neonShoppingUserId'; // Separate key for anonymous user ID
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
  currency: defaultCurrency,
  lists: [],
  selectedListId: null,
  shoppingListItems: [],
  categories: DEFAULT_CATEGORIES,
  theme: defaultThemeId,
  isLoading: true,
  isPremium: false, // Default to false
};

// --- Context ---
interface AppContextProps {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  formatCurrency: (amount: number) => string;
  isLoading: boolean;
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
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_PREMIUM_STATUS'; payload: boolean }; // Action for premium status

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
        return state;
      }
      const newList: List = {
        id: uuidv4(),
        userId: state.userId,
        ...action.payload,
      };
      newState.lists = [...state.lists, newList];
      if (newState.lists.length === 1) {
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
        item.id === action.payload ? { ...item, checked: !item.checked, dateAdded: Date.now() } : item
      );
      break;
    case 'ADD_CATEGORY': {
      const newCategory: Category = {
        id: uuidv4(),
        name: action.payload.name,
        userId: state.userId || undefined,
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
      if (reassignToId) {
        newState.shoppingListItems = state.shoppingListItems.map(item =>
          item.category === categoryId ? { ...item, category: reassignToId } : item
        );
      } else {
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
    case 'SET_PREMIUM_STATUS': // Handle premium status change
      newState = { ...state, isPremium: action.payload };
      break;
    default:
      return state;
  }

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

  useEffect(() => {
    const loadInitialData = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      let loadedStateFromStorage: Partial<AppState> = {};
      let anonymousUserId: string | null = null;

      if (typeof window !== 'undefined') {
        try {
          anonymousUserId = localStorage.getItem(USER_ID_KEY);
          if (!anonymousUserId) {
            anonymousUserId = uuidv4();
            localStorage.setItem(USER_ID_KEY, anonymousUserId);
          }

          const savedStateRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (savedStateRaw) {
            loadedStateFromStorage = JSON.parse(savedStateRaw);
          }
        } catch (e) {
          console.error("Failed to parse saved state or handle user ID, resetting:", e);
          localStorage.removeItem(LOCAL_STORAGE_KEY);
          localStorage.removeItem(USER_ID_KEY);
          anonymousUserId = uuidv4();
          localStorage.setItem(USER_ID_KEY, anonymousUserId);
        }

        let finalCurrency = loadedStateFromStorage.currency || defaultCurrency;
        if (!loadedStateFromStorage.currency) {
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
            ...initialState,
            ...loadedStateFromStorage,
            userId: loadedStateFromStorage.userId || anonymousUserId,
            currency: finalCurrency,
            lists: loadedStateFromStorage.lists || [],
            shoppingListItems: loadedStateFromStorage.shoppingListItems || [],
            categories: loadedStateFromStorage.categories && loadedStateFromStorage.categories.length > 0 ? loadedStateFromStorage.categories : DEFAULT_CATEGORIES,
            selectedListId: loadedStateFromStorage.selectedListId || ((loadedStateFromStorage.lists && loadedStateFromStorage.lists.length > 0) ? loadedStateFromStorage.lists[0].id : null),
            theme: loadedStateFromStorage.theme || defaultThemeId,
            isPremium: loadedStateFromStorage.isPremium || false, // Load premium status
            isLoading: false,
          },
        });
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };
    loadInitialData();
  }, []);

  const formatCurrency = useCallback(
    (amount: number) => {
      try {
        return new Intl.NumberFormat(undefined, {
          style: 'currency',
          currency: state.currency.code,
        }).format(amount);
      } catch (error) {
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
