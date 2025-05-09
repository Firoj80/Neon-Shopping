"use client"; // Ensures this context is client-side

import React, { createContext, useContext, useReducer, useEffect, useState, useCallback, type ReactNode } from 'react';
import { format, startOfDay, isSameDay } from 'date-fns';
import { themes, defaultThemeId } from '@/config/themes';
import { v4 as uuidv4 } from 'uuid'; // Import UUID generator
import { getUserCurrency, type Currency } from '@/services/currency'; // Import for currency detection
import { fetchFromApi } from '@/lib/api'; // For API calls

// --- Constants ---
const LOCAL_STORAGE_KEY = 'neonShoppingState';
export const FREEMIUM_LIST_LIMIT = 3;

// --- Default Categories ---
// These are the initial categories. Users can modify them if premium.
export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'uncategorized', name: 'Uncategorized' }, // Essential fallback
  { id: uuidv4(), name: 'Home Appliances' },
  { id: uuidv4(), name: 'Health' },
  { id: uuidv4(), name: 'Grocery' },
  { id: uuidv4(), name: 'Fashion' },
  { id: uuidv4(), name: 'Electronics' },
];

// --- Types ---
export interface ShoppingListItem {
  id: string;
  listId: string;
  userId: string | null; // Can be null for anonymous users
  name: string;
  quantity: number;
  price: number;
  category: string; // Category ID
  checked: boolean;
  dateAdded: number; // Timestamp
}

export interface Category {
  id: string;
  name: string;
  userId?: string | null; // User-specific categories might have a userId
}

export interface List {
  id: string;
  userId: string | null; // Can be null for anonymous users
  name: string;
  budgetLimit: number;
  defaultCategory: string; // Category ID
}

export interface BudgetItem { // Simplified for local storage, server might have more
  limit: number;
  spent: number; // Aggregated from items, might not be stored directly this way
  lastSetDate: string | null; // YYYY-MM-DD, for daily reset
}


interface AppState {
  userId: string | null; // Stores the anonymous or authenticated user ID
  app_user_id: string | null; // Specifically for anonymous local storage user
  theme: string;
  currency: Currency;
  budget: BudgetItem; // This will be list-specific, needs refactor if global budget
  lists: List[];
  selectedListId: string | null;
  shoppingListItems: ShoppingListItem[];
  categories: Category[];
  isPremium: boolean; // Premium status
  isLoading: boolean; // Global loading state for initial data
}

interface AppContextProps {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  formatCurrency: (amount: number) => string;
  isLoading: boolean; // Expose isLoading
}

// --- Initial State ---
const defaultCurrency: Currency = { code: 'USD', symbol: '$', name: 'US Dollar' };

const initialState: AppState = {
  userId: null, // Will be set by AuthContext or anonymous ID generation
  app_user_id: null, // For anonymous local user
  theme: defaultThemeId,
  currency: defaultCurrency,
  budget: { limit: 0, spent: 0, lastSetDate: null },
  lists: [],
  selectedListId: null,
  shoppingListItems: [],
  categories: DEFAULT_CATEGORIES,
  isPremium: false, // Default to non-premium
  isLoading: true, // Start in loading state
};

// --- Reducer Actions ---
type Action =
  | { type: 'LOAD_STATE'; payload: Partial<AppState> }
  | { type: 'LOAD_STATE_FROM_API'; payload: { userId: string; apiBaseUrl: string } }
  | { type: 'SET_USER_ID'; payload: string | null } // For authenticated user ID
  | { type: 'SET_APP_USER_ID'; payload: string | null } // For anonymous user ID
  | { type: 'SET_THEME'; payload: string }
  | { type: 'SET_CURRENCY'; payload: Currency }
  | { type: 'SET_BUDGET_LIMIT'; payload: { listId: string; limit: number } } // List-specific
  | { type: 'ADD_LIST'; payload: List }
  | { type: 'UPDATE_LIST'; payload: List }
  | { type: 'DELETE_LIST'; payload: string } // listId
  | { type: 'SELECT_LIST'; payload: string | null } // listId or null
  | { type: 'ADD_SHOPPING_ITEM'; payload: Omit<ShoppingListItem, 'id' | 'dateAdded' | 'checked'> }
  | { type: 'UPDATE_SHOPPING_ITEM'; payload: ShoppingListItem }
  | { type: 'REMOVE_SHOPPING_ITEM'; payload: string } // itemId
  | { type: 'TOGGLE_SHOPPING_ITEM'; payload: string } // itemId
  | { type: 'ADD_CATEGORY'; payload: { name: string; userId?: string | null } }
  | { type: 'UPDATE_CATEGORY'; payload: Category }
  | { type: 'REMOVE_CATEGORY'; payload: { categoryId: string; reassignToId?: string } }
  | { type: 'SET_PREMIUM_STATUS'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean };


// --- Reducer ---
function appReducer(state: AppState, action: Action): AppState {
  let newState = { ...state };
  switch (action.type) {
    case 'LOAD_STATE':
      newState = { ...state, ...action.payload, isLoading: false };
      break;
    case 'SET_USER_ID': // For authenticated user
      newState = { ...state, userId: action.payload };
      break;
    case 'SET_APP_USER_ID': // For anonymous local user
      newState = { ...state, app_user_id: action.payload };
      break;
    case 'SET_THEME':
      newState = { ...state, theme: action.payload };
      break;
    case 'SET_CURRENCY':
      newState = { ...state, currency: action.payload };
      break;
    case 'SET_BUDGET_LIMIT': // List-specific budget
      newState.lists = state.lists.map(list =>
        list.id === action.payload.listId ? { ...list, budgetLimit: action.payload.limit } : list
      );
      break;
    case 'ADD_LIST':
      if (!state.isPremium && state.lists.length >= FREEMIUM_LIST_LIMIT) {
        console.warn("Freemium list limit reached. Cannot add more lists.");
        // Potentially show a toast message here
        return state; // Return current state without adding
      }
      newState.lists = [...state.lists, { ...action.payload, id: action.payload.id || uuidv4() }];
      if (!state.selectedListId && newState.lists.length > 0) {
        newState.selectedListId = newState.lists[newState.lists.length -1].id;
      }
      break;
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
        console.error("Attempted to add item without listId or userId");
        return state;
      }
      const newItem: ShoppingListItem = {
        id: uuidv4(),
        ...action.payload,
        price: action.payload.price ?? 0, // Ensure price is a number, default to 0
        checked: false,
        dateAdded: Date.now(),
      };
      newState.shoppingListItems = [...state.shoppingListItems, newItem];
      break;
    }
    case 'UPDATE_SHOPPING_ITEM':
      newState.shoppingListItems = state.shoppingListItems.map(item =>
        item.id === action.payload.id ? { ...action.payload, price: action.payload.price ?? 0 } : item
      );
      break;
    case 'REMOVE_SHOPPING_ITEM':
      newState.shoppingListItems = state.shoppingListItems.filter(item => item.id !== action.payload);
      break;
    case 'TOGGLE_SHOPPING_ITEM':
      newState.shoppingListItems = state.shoppingListItems.map(item =>
        item.id === action.payload ? { ...item, checked: !item.checked, dateAdded: Date.now() } : item // Update dateAdded on toggle for history
      );
      break;
    case 'ADD_CATEGORY':
      if (!state.isPremium && state.categories.filter(c => c.id !== 'uncategorized').length >= DEFAULT_CATEGORIES.filter(c => c.id !== 'uncategorized').length && !DEFAULT_CATEGORIES.some(dc => dc.name.toLowerCase() === action.payload.name.toLowerCase())) {
         console.warn("Freemium category limit reached or attempting to add non-default category.");
         return state;
      }
      const newCatId = uuidv4();
      const newCategory: Category = {
        id: newCatId,
        name: action.payload.name,
        userId: action.payload.userId || state.userId, // Assign current user to new category
      };
      newState.categories = [...state.categories, newCategory];
      break;
    case 'UPDATE_CATEGORY':
      newState.categories = state.categories.map(cat =>
        cat.id === action.payload.id ? action.payload : cat
      );
      break;
    case 'REMOVE_CATEGORY':
        const categoryToRemove = state.categories.find(c => c.id === action.payload.categoryId);
        if (categoryToRemove && categoryToRemove.id === 'uncategorized') return state; // Cannot delete 'Uncategorized'

        const isDefaultPredefined = DEFAULT_CATEGORIES.some(dc => dc.id === action.payload.categoryId && dc.id !== 'uncategorized');
        if (!state.isPremium && isDefaultPredefined) {
            console.warn("Freemium users cannot delete predefined default categories.");
            return state;
        }
        newState.categories = state.categories.filter(cat => cat.id !== action.payload.categoryId);
        newState.shoppingListItems = state.shoppingListItems.map(item =>
            item.category === action.payload.categoryId
            ? { ...item, category: action.payload.reassignToId || 'uncategorized' }
            : item
        );
        // Also update defaultCategory in lists if it was the removed category
        newState.lists = state.lists.map(list =>
            list.defaultCategory === action.payload.categoryId
            ? { ...list, defaultCategory: action.payload.reassignToId || 'uncategorized' }
            : list
        );
        break;
    case 'SET_PREMIUM_STATUS':
      newState = { ...state, isPremium: action.payload };
      break;
    case 'SET_LOADING':
      newState = { ...state, isLoading: action.payload };
      break;
    default:
      newState = state;
  }

  // Persist to localStorage after every action except LOAD_STATE or LOAD_STATE_FROM_API (to prevent loops)
  if (action.type !== 'LOAD_STATE' && action.type !== 'LOAD_STATE_FROM_API' && typeof window !== 'undefined') {
    try {
      const stateToSave = { ...newState, isLoading: undefined }; // Don't save loading state
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (error) {
      console.error("Failed to save state to localStorage:", error);
    }
  }
  return newState;
}

// --- Context ---
const AppContext = createContext<AppContextProps | undefined>(undefined);

// --- Provider ---
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [isLoading, setIsLoading] = useState(true); // Local loading state for the provider itself

  // Load initial state from localStorage or API
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true); // Start loading
      dispatch({ type: 'SET_LOADING', payload: true });

      let appUserId = localStorage.getItem('app_user_id'); // For anonymous users
      if (!appUserId) {
        appUserId = uuidv4();
        localStorage.setItem('app_user_id', appUserId);
      }

      const savedStateRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
      let loadedStateFromStorage: Partial<AppState> = { app_user_id: appUserId };

      if (savedStateRaw) {
        try {
          const parsedState = JSON.parse(savedStateRaw);
          // Ensure parsedState doesn't overwrite critical initial values like app_user_id if it's missing from parsed
          loadedStateFromStorage = { ...parsedState, app_user_id: parsedState.app_user_id || appUserId };
        } catch (e) {
          console.error("Failed to parse saved state, resetting:", e);
          // Keep app_user_id
        }
      }
      
      // Auto-detect currency if not already set
      if (!loadedStateFromStorage.currency) {
        try {
          const detectedCurrency = await getUserCurrency();
          if (detectedCurrency) {
            loadedStateFromStorage.currency = detectedCurrency;
          } else {
            loadedStateFromStorage.currency = defaultCurrency; // Fallback
          }
        } catch (error) {
          console.error("Error auto-detecting currency:", error);
          loadedStateFromStorage.currency = defaultCurrency; // Fallback
        }
      }


      dispatch({ type: 'LOAD_STATE', payload: loadedStateFromStorage });
      setIsLoading(false); // End loading
      dispatch({ type: 'SET_LOADING', payload: false });
    };

    loadInitialData();
  }, []);


  // API data loading triggered by AuthContext or specific actions
  useEffect(() => {
    const handleApiLoad = async (userId: string, apiBaseUrl: string) => {
        setIsLoading(true);
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const data = await fetchFromApi(`data/index.php?user_id=${userId}`, { method: 'GET' }, apiBaseUrl);
            if (data) { // Assuming fetchFromApi returns data directly or an object with a data property
                 // Ensure IDs from API are strings, and quantities/prices are numbers
                const ensureStringId = (id: any): string => String(id);
                const ensureNumber = (val: any, def: number = 0): number => Number(val) || def;
                const ensureBoolean = (val: any): boolean => Boolean(val);
                const ensureTimestamp = (val: any): number => Number(val) || Date.now();


                const apiData: Partial<AppState> = {
                    lists: (data.lists || []).map((list: any) => ({
                        ...list,
                        id: ensureStringId(list.id),
                        userId: ensureStringId(list.userId),
                        budgetLimit: ensureNumber(list.budgetLimit),
                        defaultCategory: list.defaultCategory ? ensureStringId(list.defaultCategory) : 'uncategorized',
                    })),
                    shoppingListItems: (data.items || []).map((item: any) => ({
                        ...item,
                        id: ensureStringId(item.id),
                        listId: ensureStringId(item.listId),
                        userId: ensureStringId(item.userId),
                        quantity: ensureNumber(item.quantity, 1),
                        price: ensureNumber(item.price),
                        category: item.category ? ensureStringId(item.category) : 'uncategorized',
                        checked: ensureBoolean(item.checked),
                        dateAdded: ensureTimestamp(item.dateAdded),
                    })),
                    categories: (data.categories || []).map((category: any) => ({
                        ...category,
                        id: ensureStringId(category.id),
                        userId: category.userId ? ensureStringId(category.userId) : null,
                    })),
                    // Currency and premium status might also come from API
                    currency: data.user_preferences?.currency ? {
                        code: data.user_preferences.currency.code,
                        symbol: data.user_preferences.currency.symbol,
                        name: data.user_preferences.currency.name,
                    } : state.currency, // Fallback to existing state currency
                    isPremium: ensureBoolean(data.user_preferences?.is_premium),
                    userId: userId, // Set the authenticated user ID
                };
                dispatch({ type: 'LOAD_STATE', payload: apiData });
            }
        } catch (error) {
            console.error("Failed to load state from API:", error);
            // Potentially fall back to local storage or clear state if API load fails critically
        } finally {
            setIsLoading(false);
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    // This effect should be re-run if a LOAD_STATE_FROM_API action is dispatched
    // However, dispatching actions within useEffect can be tricky.
    // It's better to trigger this from where authentication happens (e.g., AuthContext).
    // For now, this effect structure isn't ideal for reacting to LOAD_STATE_FROM_API.
    // Instead, LOAD_STATE_FROM_API action itself will call handleApiLoad.
    // This effect is primarily for initial load.

  }, []); // Empty dependency array means it runs once on mount for initial setup


  // The `dispatch` function from `useReducer` is stable and doesn't need to be memoized with `useCallback`
  // unless you're passing it down to heavily memoized child components that depend on its identity.

  const formatCurrency = useCallback((amount: number) => {
    try {
      return new Intl.NumberFormat(undefined, { // Use browser's default locale
        style: 'currency',
        currency: state.currency.code,
      }).format(amount);
    } catch (error) {
      // Fallback for invalid currency codes or other formatting errors
      // console.warn(`Currency formatting error for code ${state.currency.code}:`, error);
      return `${state.currency.symbol}${amount.toFixed(2)}`;
    }
  }, [state.currency]);


  return (
    <AppContext.Provider value={{ state, dispatch, formatCurrency, isLoading: state.isLoading }}>
      {children}
    </AppContext.Provider>
  );
};

// --- Hook ---
export const useAppContext = (): AppContextProps => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
