// src/context/app-context.tsx
"use client";

import React, { createContext, useContext, useReducer, useEffect, useState, useCallback, type ReactNode } from 'react';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import type { Currency } from '@/services/currency';
import { getUserCurrency, getSupportedCurrencies } from '@/services/currency';
import { defaultThemeId } from '@/config/themes';
import { fetchFromApi } from '@/lib/api'; // Import the new API helper

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
  defaultCategory: string; // ID of the default category
}

export interface Category {
  id:string; // UUID for custom, predefined string for defaults
  name: string;
  userId?: string | null; // Null or user ID for custom categories
}

export interface AppState {
  userId: string | null; // UUID for anonymous, actual ID for logged-in
  currency: Currency;
  lists: List[];
  selectedListId: string | null;
  shoppingListItems: ShoppingListItem[];
  categories: Category[];
  isLoading: boolean;
  isPremium: boolean;
  theme: string;
}

// --- Initial State & Constants ---
const defaultCurrency: Currency = { code: 'USD', symbol: '$', name: 'US Dollar' };
export const FREEMIUM_LIST_LIMIT = 3;
export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'uncategorized', name: 'Uncategorized', userId: null },
  { id: 'home-appliances', name: 'Home Appliances', userId: null },
  { id: 'health', name: 'Health', userId: null },
  { id: 'grocery', name: 'Grocery', userId: null },
  { id: 'fashion', name: 'Fashion', userId: null },
  { id: 'electronics', name: 'Electronics', userId: null },
];

const initialState: AppState = {
  userId: null, // Will be set by AuthContext or generated if anonymous
  currency: defaultCurrency,
  lists: [],
  selectedListId: null,
  shoppingListItems: [],
  categories: DEFAULT_CATEGORIES,
  isLoading: true,
  isPremium: false,
  theme: defaultThemeId,
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
  | { type: 'SET_API_DATA'; payload: { userId: string; lists: List[]; shoppingListItems: ShoppingListItem[]; categories: Category[]; currency?: Currency, isPremium?: boolean } }
  | { type: 'SET_USER_ID'; payload: string | null }
  | { type: 'SET_CURRENCY'; payload: Currency }
  | { type: 'ADD_LIST'; payload: List }
  | { type: 'UPDATE_LIST'; payload: List }
  | { type: 'DELETE_LIST'; payload: string }
  | { type: 'SELECT_LIST'; payload: string | null }
  | { type: 'ADD_SHOPPING_ITEM'; payload: ShoppingListItem }
  | { type: 'UPDATE_SHOPPING_ITEM'; payload: ShoppingListItem }
  | { type: 'REMOVE_SHOPPING_ITEM'; payload: string }
  | { type: 'TOGGLE_SHOPPING_ITEM'; payload: ShoppingListItem }
  | { type: 'ADD_CATEGORY'; payload: Category }
  | { type: 'UPDATE_CATEGORY'; payload: Category }
  | { type: 'REMOVE_CATEGORY'; payload: { categoryId: string; reassignToId?: string } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_PREMIUM_STATUS'; payload: boolean }
  | { type: 'SET_THEME'; payload: string }
  | { type: 'RESET_APP_STATE_FOR_LOGOUT' };

// --- Reducer ---
function appReducer(state: AppState, action: Action): AppState {
  let newState = { ...state };

  switch (action.type) {
    case 'LOAD_STATE':
      newState = { ...state, ...action.payload, isLoading: false };
      // If lists are loaded and selectedListId is not among them (or null), select the first one.
      if (newState.lists.length > 0 && (!newState.selectedListId || !newState.lists.find(l => l.id === newState.selectedListId))) {
        newState.selectedListId = newState.lists[0].id;
      } else if (newState.lists.length === 0) {
        newState.selectedListId = null; // Ensure selectedListId is null if no lists
      }
      break;

    case 'SET_API_DATA':
      newState = {
        ...state,
        userId: action.payload.userId, // Ensure userId from API data is set
        lists: action.payload.lists,
        shoppingListItems: action.payload.shoppingListItems,
        categories: action.payload.categories.length > 0 ? action.payload.categories : DEFAULT_CATEGORIES,
        currency: action.payload.currency || state.currency,
        isPremium: action.payload.isPremium !== undefined ? action.payload.isPremium : state.isPremium,
        isLoading: false,
      };
      if (newState.lists.length > 0 && (!newState.selectedListId || !newState.lists.find(l => l.id === newState.selectedListId))) {
        newState.selectedListId = newState.lists[0].id;
      } else if (newState.lists.length === 0) {
        newState.selectedListId = null;
      }
      break;

    case 'SET_USER_ID':
      newState.userId = action.payload;
      // Data loading for the new userId will be handled by the useEffect in AppProvider
      break;

    case 'SET_CURRENCY':
      newState.currency = action.payload;
      if (newState.userId) {
        fetchFromApi('user/preferences.php', {
            method: 'POST',
            body: JSON.stringify({ userId: newState.userId, currencyCode: action.payload.code }),
        }).catch(err => console.error("Failed to save currency preference to backend:", err));
      }
      break;

    case 'ADD_LIST':
      newState.lists = [...state.lists, action.payload];
      if (!newState.selectedListId || state.lists.length === 0) {
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
      break;

    case 'ADD_SHOPPING_ITEM':
       if (!action.payload.listId || !action.payload.userId) {
        console.error("Attempted to add item without listId or userId", action.payload);
        return state; // Return current state if critical IDs are missing
      }
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
        item.id === action.payload.id ? { ...item, ...action.payload, checked: !item.checked, dateAdded: Date.now() } : item
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
      // Persist theme locally
      if (typeof window !== 'undefined') {
        localStorage.setItem('appTheme', action.payload);
      }
      break;
    case 'RESET_APP_STATE_FOR_LOGOUT':
      const persistedTheme = typeof window !== 'undefined' ? localStorage.getItem('appTheme') || defaultThemeId : defaultThemeId;
      newState = {
        ...initialState,
        userId: null,
        theme: persistedTheme, // Keep theme
        currency: state.currency, // Keep currency or reset
        isLoading: false,
      };
      break;
    default:
      return state;
  }
  return newState;
}

// --- Provider Component ---
export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [isInitialDataLoaded, setIsInitialDataLoaded] = useState(false);

  // Effect for loading initial local settings (theme, currency) and anonymous user ID
  useEffect(() => {
    const initializeAnonymousUserAndSettings = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      let theme = defaultThemeId;
      let currentCurrency = defaultCurrency;
      let anonymousUserId = localStorage.getItem('anonymous_user_id');

      if (typeof window !== 'undefined') {
        theme = localStorage.getItem('appTheme') || defaultThemeId;
        const storedCurrencyCode = localStorage.getItem('userCurrencyCode');
        if (storedCurrencyCode) {
            const supportedCurrencies = await getSupportedCurrencies();
            const found = supportedCurrencies.find(c => c.code === storedCurrencyCode);
            if (found) currentCurrency = found;
        } else {
            const autoDetected = await getUserCurrency();
            if (autoDetected) {
                currentCurrency = autoDetected;
                localStorage.setItem('userCurrencyCode', autoDetected.code);
            }
        }
        if (!anonymousUserId) {
            anonymousUserId = uuidv4();
            localStorage.setItem('anonymous_user_id', anonymousUserId);
        }
      }
      // Dispatch initial state for anonymous user or pre-auth state
      dispatch({ type: 'LOAD_STATE', payload: { userId: anonymousUserId, theme, currency: currentCurrency, isLoading: false } });
      setIsInitialDataLoaded(true); // Mark that basic init is done
    };

    if (!state.userId) { // Only run if no user ID is set (truly initial load or after logout)
        initializeAnonymousUserAndSettings();
    } else {
        setIsInitialDataLoaded(true); // If userId is already set (e.g. from auth context), assume init is done
        dispatch({ type: 'SET_LOADING', payload: false });
    }

  }, []); // Runs once on mount if no userId from auth yet


  // Effect for loading data from API when a *logged-in* userId changes
  useEffect(() => {
    const loadDataForAuthenticatedUser = async (userId: string) => {
      if (!userId || userId.startsWith('anon-')) return; // Don't fetch for anonymous or if no user ID
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const data = await fetchFromApi(`data/index.php?user_id=${encodeURIComponent(userId)}`, { method: 'GET' });
        if (data && data.lists && data.items && data.categories) {
          dispatch({
            type: 'SET_API_DATA',
            payload: {
              userId: userId, // Ensure the correct userId is part of the payload
              lists: data.lists,
              shoppingListItems: data.items,
              categories: data.categories,
              currency: data.user_preferences?.currency ? data.user_preferences.currency : state.currency,
              isPremium: data.user_preferences?.is_premium !== undefined ? data.user_preferences.is_premium : false,
            },
          });
        } else {
          console.error("API response missing expected data structure:", data);
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch (error) {
        console.error("Failed to load data from API for authenticated user:", error);
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    if (state.userId && !state.userId.startsWith('anon-') && isInitialDataLoaded) {
      loadDataForAuthenticatedUser(state.userId);
    }
  }, [state.userId, isInitialDataLoaded]);


  const formatCurrency = useCallback(
    (amount: number) => {
      try {
        return new Intl.NumberFormat(undefined, { // Let browser decide locale for formatting
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
