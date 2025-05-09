"use client";

import React, { createContext, useContext, useReducer, useEffect, useState, useCallback, type ReactNode } from 'react';
import { format, startOfDay, isSameDay } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import type { Currency } from '@/services/currency';
import { getUserCurrency, getSupportedCurrencies } from '@/services/currency';
import { defaultThemeId } from '@/config/themes';

// --- Configuration ---
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/php'; // PHP API Base URL

// --- Types ---
export interface ShoppingListItem {
  id: string;
  userId: string; // Ensure this is always set
  listId: string;
  name: string;
  quantity: number;
  price: number;
  category: string;
  checked: boolean;
  dateAdded: number;
}

export interface List {
  id: string;
  userId: string; // Ensure this is always set
  name: string;
  budgetLimit: number;
  defaultCategory: string;
}

export interface Category {
  id: string;
  name: string;
  userId?: string; // If categories can be user-specific on backend
}

export interface AppState {
  userId: string | null; // Will be set by AuthContext
  currency: Currency;
  lists: List[];
  selectedListId: string | null;
  shoppingListItems: ShoppingListItem[];
  categories: Category[];
  isLoading: boolean; // General app data loading state
  isPremium: boolean;
  theme: string;
}

// --- Initial State & Constants ---
const LOCAL_STORAGE_SETTINGS_KEY = 'neonShoppingSettings'; // For theme and potentially currency fallback
const defaultCurrency: Currency = { code: 'USD', symbol: '$', name: 'US Dollar' };
export const FREEMIUM_LIST_LIMIT = 3;
export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'uncategorized', name: 'Uncategorized' },
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
  categories: DEFAULT_CATEGORIES, // Will be overridden by API if user has custom categories
  isLoading: true, // Start with true, set to false after initial load/auth check
  isPremium: false,
  theme: defaultThemeId,
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
  | { type: 'LOAD_STATE'; payload: Partial<AppState> } // For initial local settings like theme
  | { type: 'LOAD_STATE_FROM_API'; payload: { userId: string; currencyCode?: string; /* other data from API */ } }
  | { type: 'SET_API_DATA'; payload: { lists: List[]; shoppingListItems: ShoppingListItem[]; categories: Category[]; currency?: Currency, isPremium?: boolean } }
  | { type: 'SET_USER_ID'; payload: string | null } // To sync from AuthContext
  | { type: 'SET_CURRENCY'; payload: Currency }
  | { type: 'ADD_LIST'; payload: List } // Payload is now the full list object from API
  | { type: 'UPDATE_LIST'; payload: List } // Payload is now the full list object from API
  | { type: 'DELETE_LIST'; payload: string }
  | { type: 'SELECT_LIST'; payload: string | null }
  | { type: 'ADD_SHOPPING_ITEM'; payload: ShoppingListItem } // Payload is now the full item from API
  | { type: 'UPDATE_SHOPPING_ITEM'; payload: ShoppingListItem } // Payload is now the full item from API
  | { type: 'REMOVE_SHOPPING_ITEM'; payload: string }
  | { type: 'TOGGLE_SHOPPING_ITEM'; payload: ShoppingListItem } // Payload is now the full item from API
  | { type: 'ADD_CATEGORY'; payload: Category } // Payload is now the full category from API
  | { type: 'UPDATE_CATEGORY'; payload: Category } // Payload is now the full category from API
  | { type: 'REMOVE_CATEGORY'; payload: { categoryId: string; reassignToId?: string } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_PREMIUM_STATUS'; payload: boolean }
  | { type: 'SET_THEME'; payload: string }
  | { type: 'RESET_APP_STATE_FOR_LOGOUT' };


// --- API Helper ---
async function fetchFromApi(endpoint: string, userId: string | null, options: RequestInit = {}) {
  if (!userId) {
    console.warn(`Cannot fetch from ${endpoint}: userId is null.`);
    // Optionally, instead of throwing, return a specific error object or an empty successful-like response
    // to prevent breaking the calling code, if that's preferred.
    throw new Error("User not authenticated for API request.");
  }
  const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      // You might need to send a session cookie or token here if your PHP backend requires it
      // For PHP sessions, the browser usually handles cookies automatically.
      // If using a token: 'Authorization': `Bearer ${your_auth_token}`
      'X-User-ID': userId, // Example of sending user ID in a custom header
      ...(options.headers || {}),
    },
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to fetch data and parse error' }));
    throw new Error(errorData.message || `API request failed: ${response.statusText}`);
  }
  return response.json();
}


// --- Reducer ---
function appReducer(state: AppState, action: Action): AppState {
  let newState = { ...state };

  switch (action.type) {
    case 'LOAD_STATE': // Used for local settings like theme, and initial currency detection
      newState = { ...state, ...action.payload, isLoading: false };
      break;

    case 'SET_API_DATA':
      newState = {
        ...state,
        lists: action.payload.lists,
        shoppingListItems: action.payload.shoppingListItems,
        categories: action.payload.categories.length > 0 ? action.payload.categories : DEFAULT_CATEGORIES,
        currency: action.payload.currency || state.currency,
        isPremium: action.payload.isPremium !== undefined ? action.payload.isPremium : state.isPremium,
        isLoading: false,
      };
      if (action.payload.lists.length > 0 && !newState.lists.find(l => l.id === newState.selectedListId)) {
        newState.selectedListId = action.payload.lists[0].id;
      } else if (action.payload.lists.length === 0) {
        newState.selectedListId = null;
      }
      break;

    case 'SET_USER_ID': // Sync userId from AuthContext
      newState.userId = action.payload;
      if (!action.payload) { // If logging out, reset data
        newState.lists = [];
        newState.shoppingListItems = [];
        newState.categories = DEFAULT_CATEGORIES;
        newState.selectedListId = null;
        newState.isPremium = false;
      }
      break;

    case 'SET_CURRENCY':
      newState.currency = action.payload;
      // Persist currency preference locally and potentially to backend
      if (typeof window !== 'undefined') {
        const localSettings = JSON.parse(localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY) || '{}');
        localSettings.currency = action.payload;
        localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(localSettings));
      }
      // TODO: API call to save currency preference to backend if user is logged in
      if (newState.userId) {
        fetchFromApi(`user/preferences.php?action=set_currency&user_id=${newState.userId}`, newState.userId, { // Include user_id in query params for GET or body for POST
            method: 'POST',
            body: JSON.stringify({ currencyCode: action.payload.code }),
        }).catch(err => console.error("Failed to save currency preference to backend:", err));
      }
      break;

    case 'ADD_LIST':
      newState.lists = [...state.lists, action.payload];
      if (!newState.selectedListId || newState.lists.length === 0) { // Select if first list
        newState.selectedListId = action.payload.id;
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
      // Save selectedListId to local settings for persistence across sessions if desired
      if (typeof window !== 'undefined') {
        const localSettings = JSON.parse(localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY) || '{}');
        localSettings.selectedListId = action.payload;
        localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(localSettings));
      }
      break;

    case 'ADD_SHOPPING_ITEM':
      newState.shoppingListItems = [...state.shoppingListItems, action.payload];
      break;
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
        item.id === action.payload.id ? action.payload : item // API returns the updated item
      );
      break;

    case 'ADD_CATEGORY':
      newState.categories = [...state.categories, action.payload];
      break;
    case 'UPDATE_CATEGORY':
      newState.categories = state.categories.map(cat =>
        cat.id === action.payload.id ? action.payload : cat
      );
      break;
    case 'REMOVE_CATEGORY': {
      const { categoryId, reassignToId } = action.payload;
      newState.categories = state.categories.filter(cat => cat.id !== categoryId);
      const finalReassignToId = reassignToId || 'uncategorized';
      newState.shoppingListItems = state.shoppingListItems.map(item =>
        item.category === categoryId ? { ...item, category: finalReassignToId } : item
      );
      break;
    }
    case 'SET_LOADING':
      newState.isLoading = action.payload;
      break;
    case 'SET_PREMIUM_STATUS':
      newState.isPremium = action.payload;
      break;
    case 'SET_THEME':
      newState.theme = action.payload;
      if (typeof window !== 'undefined') {
        const localSettings = JSON.parse(localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY) || '{}');
        localSettings.theme = action.payload;
        localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(localSettings));
      }
      break;
    case 'RESET_APP_STATE_FOR_LOGOUT':
      newState = {
        ...initialState,
        userId: null, // Ensure userId is null after logout
        // Keep local settings like theme and currency if desired, or reset them too
        theme: state.theme, // Persist theme across logout
        currency: state.currency, // Persist currency or reset to default/auto-detected
        isLoading: false,
      };
      break;
    default:
      return state;
  }

  // No longer saving entire app state to localStorage here.
  // Only specific settings like theme, selectedListId, and currency are saved directly.
  return newState;
}

// --- Provider Component ---
export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Effect for loading initial local settings (theme, currency)
  useEffect(() => {
    const loadLocalSettings = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      let theme = defaultThemeId;
      let currency = defaultCurrency;
      let selectedListId = null;

      if (typeof window !== 'undefined') {
        try {
          const localSettingsRaw = localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY);
          if (localSettingsRaw) {
            const localSettings = JSON.parse(localSettingsRaw);
            theme = localSettings.theme || defaultThemeId;
            currency = localSettings.currency || defaultCurrency; // Load saved currency
            selectedListId = localSettings.selectedListId || null;
          }

          // Attempt auto-detection if no currency is saved or if it's the default (first time UX)
          if (!localSettingsRaw || !JSON.parse(localSettingsRaw).currency) {
              const autoDetectedCurrency = await getUserCurrency();
              if (autoDetectedCurrency) {
                  currency = autoDetectedCurrency;
                  // Save auto-detected currency to local settings
                  const currentSettings = JSON.parse(localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY) || '{}');
                  currentSettings.currency = autoDetectedCurrency;
                  localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(currentSettings));
              }
          }
        } catch (e) {
          console.error("Failed to parse local settings:", e);
        }
      }
      dispatch({ type: 'LOAD_STATE', payload: { theme, currency, selectedListId, isLoading: false } });
    };
    loadLocalSettings();
  }, []);


  // Effect for loading data from API when userId changes (after login)
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const loadDataFromApi = async (userId: string, currencyCode?: string) => {
        if (!userId) return; // Don't fetch if no user ID
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            // Construct the query parameters string
            let queryParams = `?action=get_all&user_id=${encodeURIComponent(userId)}`;
            if (currencyCode) {
                queryParams += `&currency_code=${encodeURIComponent(currencyCode)}`;
            }

            const data = await fetchFromApi(`data/index.php${queryParams}`, userId, { signal });
            // Ensure data has the expected structure
            if (data && Array.isArray(data.lists) && Array.isArray(data.items) && Array.isArray(data.categories)) {
                dispatch({
                    type: 'SET_API_DATA',
                    payload: {
                        lists: data.lists,
                        shoppingListItems: data.items,
                        categories: data.categories,
                        currency: data.currency || state.currency, // Use API currency if available
                        isPremium: data.isPremium !== undefined ? data.isPremium : state.isPremium,
                    },
                });
            } else {
                 console.error("API response does_not match expected structure:", data);
                 // Handle unexpected structure, e.g., dispatch an error or reset to empty
                 dispatch({ type: 'SET_API_DATA', payload: { lists: [], shoppingListItems: [], categories: DEFAULT_CATEGORIES, currency: state.currency, isPremium: state.isPremium } });
            }

        } catch (error: any) {
            if (error.name === 'AbortError') {
                console.log('API fetch aborted');
            } else {
                console.error("Failed to load data from API:", error);
                 // Keep existing local state or reset to empty, depending on desired UX
                dispatch({ type: 'SET_LOADING', payload: false }); // Stop loading on error
            }
        }
    };

    if (state.userId) {
        loadDataFromApi(state.userId, state.currency.code);
    } else {
        // If no userId (user logged out or not yet logged in), ensure isLoading is false
        // and potentially clear out data if not handled by RESET_APP_STATE_FOR_LOGOUT
        if(state.isLoading) {
             dispatch({ type: 'SET_LOADING', payload: false });
        }
    }
    return () => {
        controller.abort();
    };
  }, [state.userId, state.currency.code]); // Rerun when userId or currency changes

  const formatCurrency = useCallback(
    (amount: number) => {
      try {
        return new Intl.NumberFormat(undefined, {
          style: 'currency',
          currency: state.currency.code,
        }).format(amount);
      } catch (error) {
        console.warn(`Currency formatting error for ${state.currency.code}, using fallback.`);
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
