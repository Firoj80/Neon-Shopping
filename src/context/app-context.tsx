"use client";

import React, { createContext, useContext, useReducer, useEffect, useState, useCallback, type ReactNode } from 'react';
import { format, startOfDay, isSameDay } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { getUserCurrency, type Currency } from '@/services/currency';
import { defaultThemeId } from '@/config/themes'; // Import defaultThemeId

const LOCAL_STORAGE_KEY_PREFIX = 'neonShoppingState_v5_user_';
export const FREEMIUM_LIST_LIMIT = 3; // For potential future use
export const FREEMIUM_CATEGORY_LIMIT = 5; // For potential future use

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
  dateAdded: number;
}

export interface Category {
  id: string;
  name: string;
  userId: string | null;
}

export interface List {
  id: string;
  userId: string;
  name: string;
  budgetLimit: number;
  defaultCategory: string;
}

interface AppState {
  userId: string; // Will always have a UUID
  currency: Currency;
  lists: List[];
  selectedListId: string | null;
  shoppingListItems: ShoppingListItem[];
  categories: Category[];
  theme: string; // Theme ID
  isLoading: boolean;
  isInitialDataLoaded: boolean;
  isPremium: boolean; // Kept for potential future, defaults to true for local storage version
}

interface AppContextProps {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  formatCurrency: (amount: number) => string;
  isLoading: boolean;
}

const defaultCurrency: Currency = { code: 'USD', symbol: '$', name: 'US Dollar' };

const initialState: AppState = {
  userId: '', // Will be set on initial load
  currency: defaultCurrency,
  lists: [],
  selectedListId: null,
  shoppingListItems: [],
  categories: [...DEFAULT_CATEGORIES],
  theme: defaultThemeId,
  isLoading: true,
  isInitialDataLoaded: false,
  isPremium: true, // Simplified: all features enabled for local storage version
};

type Action =
  | { type: 'LOAD_STATE'; payload: Partial<AppState> & { userId: string } }
  | { type: 'SET_CURRENCY'; payload: Currency }
  | { type: 'ADD_LIST'; payload: List }
  | { type: 'UPDATE_LIST'; payload: List }
  | { type: 'DELETE_LIST'; payload: string }
  | { type: 'SELECT_LIST'; payload: string | null }
  | { type: 'ADD_SHOPPING_ITEM'; payload: ShoppingListItem }
  | { type: 'UPDATE_SHOPPING_ITEM'; payload: ShoppingListItem }
  | { type: 'REMOVE_SHOPPING_ITEM'; payload: string }
  | { type: 'TOGGLE_SHOPPING_ITEM'; payload: string }
  | { type: 'ADD_CATEGORY'; payload: { name: string } }
  | { type: 'UPDATE_CATEGORY'; payload: { id: string; name: string } }
  | { type: 'REMOVE_CATEGORY'; payload: { categoryId: string; reassignToId?: string } }
  | { type: 'SET_THEME'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean };

const mergeCategories = (defaultCats: Category[], storedCats: Category[], currentUserId: string): Category[] => {
  const categoryMap = new Map<string, Category>();
  defaultCats.forEach(cat => categoryMap.set(cat.id, { ...cat, userId: null }));
  storedCats.forEach(cat => {
    if (cat.userId === currentUserId || cat.userId === null) {
      categoryMap.set(cat.id, cat);
    }
  });
  return Array.from(categoryMap.values());
};

function appReducer(state: AppState, action: Action): AppState {
  let newState = { ...state };

  switch (action.type) {
    case 'LOAD_STATE':
      const { userId: loadedUserId, ...restOfPayload } = action.payload;
      newState = {
        ...initialState, // Start fresh but keep defaults
        userId: loadedUserId, // Crucial: set the determined userId
        ...restOfPayload,
        currency: restOfPayload.currency || initialState.currency,
        categories: mergeCategories(DEFAULT_CATEGORIES, restOfPayload.categories || [], loadedUserId),
        theme: restOfPayload.theme || initialState.theme,
        isLoading: false,
        isInitialDataLoaded: true,
      };
      // Ensure selectedListId is valid for the loaded user's lists
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
    case 'SET_CURRENCY':
      newState.currency = action.payload;
      break;
    case 'ADD_LIST':
      const newListWithUserId = { ...action.payload, userId: state.userId };
      newState.lists = [...state.lists, newListWithUserId];
      if (!state.selectedListId || state.lists.filter(l => l.userId === state.userId).length === 0) {
        newState.selectedListId = newListWithUserId.id;
      }
      break;
    case 'UPDATE_LIST':
      newState.lists = state.lists.map(list =>
        list.id === action.payload.id && list.userId === state.userId ? { ...action.payload, userId: state.userId } : list
      );
      break;
    case 'DELETE_LIST':
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
      const listToSelect = state.lists.find(l => l.id === action.payload);
      if (action.payload === null || (listToSelect && listToSelect.userId === state.userId)) {
        newState.selectedListId = action.payload;
      }
      break;
    case 'ADD_SHOPPING_ITEM':
      if (action.payload.listId && action.payload.userId === state.userId) {
        newState.shoppingListItems = [...state.shoppingListItems, { ...action.payload, userId: state.userId }];
      }
      break;
    case 'UPDATE_SHOPPING_ITEM':
      if (action.payload.userId === state.userId) {
        newState.shoppingListItems = state.shoppingListItems.map(item =>
          item.id === action.payload.id ? { ...action.payload, userId: state.userId } : item
        );
      }
      break;
    case 'REMOVE_SHOPPING_ITEM':
      const itemToRemove = state.shoppingListItems.find(item => item.id === action.payload);
      if (itemToRemove && itemToRemove.userId === state.userId) {
        newState.shoppingListItems = state.shoppingListItems.filter(item => item.id !== action.payload);
      }
      break;
    case 'TOGGLE_SHOPPING_ITEM':
      const itemToToggle = state.shoppingListItems.find(item => item.id === action.payload);
      if (itemToToggle && itemToToggle.userId === state.userId) {
        newState.shoppingListItems = state.shoppingListItems.map(item =>
          item.id === action.payload ? { ...item, checked: !item.checked, dateAdded: Date.now(), userId: state.userId } : item
        );
      }
      break;
    case 'ADD_CATEGORY':
      const newCategory: Category = {
        id: uuidv4(),
        name: action.payload.name,
        userId: state.userId,
      };
      newState.categories = [...state.categories, newCategory];
      break;
    case 'UPDATE_CATEGORY':
      const categoryToUpdate = state.categories.find(c => c.id === action.payload.id);
      if (categoryToUpdate && (categoryToUpdate.userId === state.userId || categoryToUpdate.userId === null)) {
        newState.categories = state.categories.map(cat =>
          cat.id === action.payload.id ? { ...cat, name: action.payload.name } : cat
        );
      }
      break;
    case 'REMOVE_CATEGORY':
      const categoryToRemove = state.categories.find(c => c.id === action.payload.categoryId);
      if (categoryToRemove && categoryToRemove.id !== 'uncategorized' && (categoryToRemove.userId === state.userId || categoryToRemove.userId === null)) {
        newState.categories = state.categories.filter(cat => cat.id !== action.payload.categoryId);
        const reassignId = action.payload.reassignToId || 'uncategorized';
        newState.shoppingListItems = state.shoppingListItems.map(item =>
          item.category === action.payload.categoryId && item.userId === state.userId ? { ...item, category: reassignId } : item
        );
        newState.lists = state.lists.map(list =>
          list.defaultCategory === action.payload.categoryId && list.userId === state.userId ? { ...list, defaultCategory: reassignId } : list
        );
      }
      break;
    case 'SET_THEME':
      newState.theme = action.payload;
      break;
    case 'SET_LOADING':
      newState.isLoading = action.payload;
      break;
    default:
      return state;
  }

  if (state.userId && typeof window !== 'undefined' && action.type !== 'LOAD_STATE' && action.type !== 'SET_LOADING') {
    try {
      const { isLoading: _omittedIsLoading, isInitialDataLoaded: _omittedIsInitial, ...stateToSave } = newState;
      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${state.userId}`, JSON.stringify(stateToSave));
    } catch (error) {
      console.error("Failed to save state to localStorage:", error);
    }
  }
  return newState;
}

export const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [isLoading, setIsLoading] = useState(true); // Overall loading for initial setup
  const [isInitialDataLoaded, setIsInitialDataLoaded] = useState(false);


  useEffect(() => {
    const loadInitialData = async () => {
      if (isInitialDataLoaded) return; // Prevent re-running
      setIsLoading(true);

      let userId = localStorage.getItem('app_user_id'); // Use a generic key for anon ID
      if (!userId) {
        userId = `anon_${uuidv4()}`;
        localStorage.setItem('app_user_id', userId);
      }

      let loadedStateFromStorage: Partial<Omit<AppState, 'isLoading' | 'isInitialDataLoaded'>> = {};
      const storageKey = `${LOCAL_STORAGE_KEY_PREFIX}${userId}`;
      const storedStateRaw = localStorage.getItem(storageKey);

      if (storedStateRaw) {
        try {
          loadedStateFromStorage = JSON.parse(storedStateRaw);
        } catch (e) {
          console.error("Failed to parse stored state, resetting for user:", userId, e);
          localStorage.removeItem(storageKey); // Clear corrupted state
        }
      }

      let currencyToSet = defaultCurrency;
      if (loadedStateFromStorage.currency) {
        currencyToSet = loadedStateFromStorage.currency;
      } else {
        try {
          const detectedCurrency = await getUserCurrency();
          if (detectedCurrency) currencyToSet = detectedCurrency;
        } catch (e) {
          console.error("Currency auto-detection failed:", e);
        }
      }

      dispatch({
        type: 'LOAD_STATE',
        payload: {
          ...initialState,
          ...loadedStateFromStorage,
          userId: userId, // Ensure this is set
          currency: currencyToSet,
          theme: loadedStateFromStorage.theme || defaultThemeId,
          // lists, selectedListId, shoppingListItems, categories will be from loadedStateFromStorage or initialState's default
        },
      });
      setIsInitialDataLoaded(true);
      setIsLoading(false); // Initial load complete
    };

    loadInitialData();
  }, [isInitialDataLoaded]);


  const formatCurrency = useCallback((amount: number) => {
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: state.currency.code,
      }).format(amount);
    } catch (error) {
      console.warn("Currency formatting error for code:", state.currency.code, error);
      return `${state.currency.symbol || '$'}${amount.toFixed(2)}`;
    }
  }, [state.currency]);

  // Use the local isLoading state for the provider value
  return (
    <AppContext.Provider value={{ state, dispatch, formatCurrency, isLoading }}>
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
