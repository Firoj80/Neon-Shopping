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
  userId: string;
  listId: string;
  name: string;
  quantity: number;
  price: number;
  category: string; // Should be category ID
  checked: boolean;
  dateAdded: number; // Timestamp
}

export interface List {
  id:string;
  userId: string;
  name: string;
  budgetLimit: number;
  defaultCategory: string; // Should be category ID
}

export interface Category {
  id: string;
  name: string;
  userId?: string; // To identify user-created categories vs default
}

export interface AppState {
  userId: string | null;
  currency: Currency;
  lists: List[];
  selectedListId: string | null;
  shoppingListItems: ShoppingListItem[];
  categories: Category[];
  isLoading: boolean;
  isPremium: boolean;
}

// --- Initial State & Constants ---
const LOCAL_STORAGE_KEY = 'neonShoppingAppState';
const USER_ID_KEY = 'neonShoppingUserId';
const defaultCurrency: Currency = { code: 'USD', symbol: '$', name: 'US Dollar' };

export const FREEMIUM_LIST_LIMIT = 3;

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'uncategorized', name: 'Uncategorized' }, // Essential
  { id: 'home-appliances', name: 'Home Appliances' },
  { id: 'health', name: 'Health' },
  { id: 'grocery', name: 'Grocery' },
  { id: 'fashion', name: 'Fashion' },
  { id: 'electronics', name: 'Electronics' },
];

const initialState: AppState = {
  userId: null,
  currency: defaultCurrency,
  lists: [],
  selectedListId: null,
  shoppingListItems: [],
  categories: DEFAULT_CATEGORIES,
  isLoading: true,
  isPremium: false,
};

// --- Context ---
interface AppContextProps {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  formatCurrency: (amount: number) => string;
  isLoading: boolean; // Combined loading state
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
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_PREMIUM_STATUS'; payload: boolean };

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
      if (!state.isPremium && state.lists.length >= FREEMIUM_LIST_LIMIT) {
        console.warn("Freemium list limit reached. Upgrade to add more lists.");
        // The UI component (e.g., ListsCarousel) should show a toast.
        return state; // Prevent adding the list
      }
      const newList: List = {
        id: uuidv4(),
        userId: state.userId,
        ...action.payload,
      };
      newState.lists = [...state.lists, newList];
      // Auto-select the new list if it's the first one or no list is currently selected
      if (!newState.selectedListId || newState.lists.length === 1) {
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
      if (!state.isPremium) {
        console.warn("Freemium users cannot add custom categories. Please upgrade.");
        // UI should handle toast/message.
        return state;
      }
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
      const categoryToRemove = state.categories.find(cat => cat.id === categoryId);

      if (!categoryToRemove) return state;

      if (categoryToRemove.id === 'uncategorized') {
        console.warn("The 'Uncategorized' category cannot be deleted directly.");
        return state;
      }

      const isDefault = DEFAULT_CATEGORIES.some(dc => dc.id === categoryId);
      if (!state.isPremium && isDefault) {
        console.warn("Freemium users cannot delete default categories. Please upgrade.");
        // UI should show message.
        return state;
      }

      newState.categories = state.categories.filter(cat => cat.id !== categoryId);
      const finalReassignId = reassignToId || 'uncategorized';

      newState.shoppingListItems = state.shoppingListItems.map(item =>
        item.category === categoryId ? { ...item, category: finalReassignId } : item
      );
      break;
    }
    case 'SET_LOADING':
      newState = { ...state, isLoading: action.payload };
      break;
    case 'SET_PREMIUM_STATUS':
      newState = { ...state, isPremium: action.payload };
      break;
    default:
      return state;
  }

  if (typeof window !== 'undefined') {
    try {
      // Ensure userId is always part of the saved state if available
      const stateToSave = { ...newState, userId: state.userId };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (error) {
      console.error("Failed to save state to localStorage:", error);
    }
  }
  return newState;
}

// --- Provider Component ---
export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [isInitialLoading, setIsInitialLoading] = useState(true); // Separate initial loading state

  useEffect(() => {
    const loadInitialData = async () => {
      setIsInitialLoading(true);
      let loadedStateFromStorage: Partial<AppState> = {};
      let anonymousUserId: string | null = null; // For users not logged in

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
          // anonymousUserId will be generated if USER_ID_KEY was also cleared or invalid
          if (!localStorage.getItem(USER_ID_KEY)) {
             anonymousUserId = uuidv4();
             localStorage.setItem(USER_ID_KEY, anonymousUserId);
          } else {
             anonymousUserId = localStorage.getItem(USER_ID_KEY); // Re-fetch if it was valid
          }
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
        
        const initialSelectedListId = 
          loadedStateFromStorage.selectedListId || 
          (Array.isArray(loadedStateFromStorage.lists) && loadedStateFromStorage.lists.length > 0 ? loadedStateFromStorage.lists[0].id : null);

        dispatch({
          type: 'LOAD_STATE',
          payload: {
            ...initialState, // Start with defaults
            ...loadedStateFromStorage, // Override with stored data
            userId: loadedStateFromStorage.userId || anonymousUserId, // Crucial: use stored userId if available, else anon
            currency: finalCurrency,
            lists: Array.isArray(loadedStateFromStorage.lists) ? loadedStateFromStorage.lists : [],
            shoppingListItems: Array.isArray(loadedStateFromStorage.shoppingListItems) ? loadedStateFromStorage.shoppingListItems : [],
            categories: Array.isArray(loadedStateFromStorage.categories) && loadedStateFromStorage.categories.length > 0 ? loadedStateFromStorage.categories : DEFAULT_CATEGORIES,
            selectedListId: initialSelectedListId,
            isPremium: loadedStateFromStorage.isPremium || false, // Load premium status
          },
        });
      }
      setIsInitialLoading(false); // Initial load complete
    };
    loadInitialData();
  }, []);


  const formatCurrency = useCallback(
    (amount: number) => {
      try {
        return new Intl.NumberFormat(undefined, { // Use user's locale for formatting
          style: 'currency',
          currency: state.currency.code,
        }).format(amount);
      } catch (error) {
        // Fallback for unsupported currency codes or other errors
        console.warn(`Currency formatting error for ${state.currency.code}, using fallback. Error: ${error}`);
        return `${state.currency.symbol}${amount.toFixed(2)}`;
      }
    },
    [state.currency]
  );

  return (
    <AppContext.Provider value={{ state, dispatch, formatCurrency, isLoading: isInitialLoading }}>
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
