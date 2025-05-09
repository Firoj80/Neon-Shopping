// src/context/app-context.tsx
"use client";

import React, { createContext, useContext, useReducer, useEffect, useState, useCallback, type ReactNode } from 'react';
import { format, startOfDay, isSameDay } from 'date-fns';
// import { themes, defaultThemeId } from '@/config/themes'; // Themes removed as per request
import { v4 as uuidv4 } from 'uuid';
import { getUserCurrency, type Currency } from '@/services/currency';
import { fetchFromApi } from '@/lib/api'; // Ensure this path is correct

const LOCAL_STORAGE_KEY = 'neonShoppingState_v2'; // Consider versioning if schema changes significantly
export const FREEMIUM_LIST_LIMIT = 3;
export const FREEMIUM_CATEGORY_LIMIT = 5; // Default categories + few custom

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'uncategorized', name: 'Uncategorized', userId: null },
  { id: uuidv4(), name: 'Home Appliances', userId: null },
  { id: uuidv4(), name: 'Health', userId: null },
  { id: uuidv4(), name: 'Grocery', userId: null },
  { id: uuidv4(), name: 'Fashion', userId: null },
  { id: uuidv4(), name: 'Electronics', userId: null },
];

export interface ShoppingListItem {
  id: string;
  listId: string;
  userId: string | null;
  name: string;
  quantity: number;
  price: number;
  category: string;
  checked: boolean;
  dateAdded: number;
}

export interface Category {
  id:string;
  name: string;
  userId: string | null; // Null for default categories, userId for custom ones
}

export interface List {
  id: string;
  userId: string | null;
  name: string;
  budgetLimit: number;
  defaultCategory: string;
}

export interface BudgetItem {
  limit: number;
  spent: number;
  lastSetDate: string | null;
}

interface AppState {
  userId: string | null;
  apiBaseUrl: string;
  // theme: string; // Themes removed
  currency: Currency;
  budget: BudgetItem; // This needs to be list-specific
  lists: List[];
  selectedListId: string | null;
  shoppingListItems: ShoppingListItem[];
  categories: Category[];
  isLoading: boolean;
  isPremium: boolean; // Added premium status
}

interface AppContextProps {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  formatCurrency: (amount: number) => string;
  isLoading: boolean;
}

const defaultCurrency: Currency = { code: 'USD', symbol: '$', name: 'US Dollar' };

const initialState: AppState = {
  userId: null,
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || '/api', // Default API base URL
  // theme: defaultThemeId, // Themes removed
  currency: defaultCurrency,
  budget: { limit: 0, spent: 0, lastSetDate: null }, // Will become list-specific
  lists: [],
  selectedListId: null,
  shoppingListItems: [],
  categories: DEFAULT_CATEGORIES,
  isLoading: true,
  isPremium: false, // Default to non-premium
};

type Action =
  | { type: 'LOAD_STATE'; payload: Partial<AppState> }
  | { type: 'LOAD_STATE_FROM_API'; payload: { userId: string; apiBaseUrl: string } }
  | { type: 'SET_USER_ID'; payload: string | null }
  // | { type: 'SET_THEME'; payload: string } // Themes removed
  | { type: 'SET_CURRENCY'; payload: Currency }
  | { type: 'SET_BUDGET_LIMIT'; payload: { listId: string; limit: number } }
  | { type: 'ADD_LIST'; payload: List }
  | { type: 'UPDATE_LIST'; payload: List }
  | { type: 'DELETE_LIST'; payload: string }
  | { type: 'SELECT_LIST'; payload: string | null }
  | { type: 'ADD_SHOPPING_ITEM'; payload: Omit<ShoppingListItem, 'id' | 'dateAdded' | 'checked'> }
  | { type: 'UPDATE_SHOPPING_ITEM'; payload: ShoppingListItem }
  | { type: 'REMOVE_SHOPPING_ITEM'; payload: string }
  | { type: 'TOGGLE_SHOPPING_ITEM'; payload: string }
  | { type: 'ADD_CATEGORY'; payload: { name: string; userId?: string | null } }
  | { type: 'UPDATE_CATEGORY'; payload: Category }
  | { type: 'REMOVE_CATEGORY'; payload: { categoryId: string; reassignToId?: string } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_PREMIUM_STATUS'; payload: boolean }; // Action for premium status

function appReducer(state: AppState, action: Action): AppState {
  let newState = { ...state };
  switch (action.type) {
    case 'LOAD_STATE':
      newState = { ...state, ...action.payload, isLoading: false };
      break;
    case 'SET_USER_ID':
      newState = { ...state, userId: action.payload };
      break;
    // case 'SET_THEME': // Themes removed
    //   newState = { ...state, theme: action.payload };
    //   break;
    case 'SET_CURRENCY':
      newState = { ...state, currency: action.payload };
      break;
    case 'SET_BUDGET_LIMIT':
      newState.lists = state.lists.map(list =>
        list.id === action.payload.listId ? { ...list, budgetLimit: action.payload.limit } : list
      );
      break;
    case 'ADD_LIST':
      if (!state.isPremium && state.lists.filter(l => l.userId === state.userId).length >= FREEMIUM_LIST_LIMIT) {
        console.warn("Freemium list limit reached.");
        return state;
      }
      const newListWithId = { ...action.payload, id: action.payload.id || uuidv4(), userId: state.userId };
      newState.lists = [...state.lists, newListWithId];
      if (!state.selectedListId && newState.lists.length > 0) {
        newState.selectedListId = newListWithId.id;
      }
      break;
    case 'UPDATE_LIST':
      newState.lists = state.lists.map(list =>
        list.id === action.payload.id ? { ...action.payload, userId: state.userId } : list
      );
      break;
    case 'DELETE_LIST':
      newState.lists = state.lists.filter(list => list.id !== action.payload);
      newState.shoppingListItems = state.shoppingListItems.filter(item => item.listId !== action.payload);
      if (state.selectedListId === action.payload) {
        const userLists = newState.lists.filter(l => l.userId === state.userId);
        newState.selectedListId = userLists.length > 0 ? userLists[0].id : null;
      }
      break;
    case 'SELECT_LIST':
      newState.selectedListId = action.payload;
      break;
    case 'ADD_SHOPPING_ITEM': {
      if (!action.payload.listId || !state.userId) {
        console.error("Attempted to add item without listId or current userId");
        return state;
      }
      const newItem: ShoppingListItem = {
        id: uuidv4(),
        ...action.payload,
        userId: state.userId, // Ensure userId is set from current state
        price: action.payload.price ?? 0,
        checked: false,
        dateAdded: Date.now(),
      };
      newState.shoppingListItems = [...state.shoppingListItems, newItem];
      break;
    }
    case 'UPDATE_SHOPPING_ITEM':
      newState.shoppingListItems = state.shoppingListItems.map(item =>
        item.id === action.payload.id ? { ...action.payload, price: action.payload.price ?? 0, userId: state.userId } : item
      );
      break;
    case 'REMOVE_SHOPPING_ITEM':
      newState.shoppingListItems = state.shoppingListItems.filter(item => item.id !== action.payload);
      break;
    case 'TOGGLE_SHOPPING_ITEM':
      newState.shoppingListItems = state.shoppingListItems.map(item =>
        item.id === action.payload ? { ...item, checked: !item.checked, dateAdded: Date.now() } : item
      );
      break;
    case 'ADD_CATEGORY':
      const userCategoriesCount = state.categories.filter(c => c.userId === state.userId).length;
      if (!state.isPremium && userCategoriesCount >= FREEMIUM_CATEGORY_LIMIT) {
          console.warn("Freemium category limit reached for custom categories.");
          return state;
      }
      const newCat: Category = {
        id: uuidv4(),
        name: action.payload.name,
        userId: action.payload.userId || state.userId,
      };
      newState.categories = [...state.categories, newCat];
      break;
    case 'UPDATE_CATEGORY':
        const categoryToUpdate = state.categories.find(c => c.id === action.payload.id);
        if (categoryToUpdate && categoryToUpdate.userId === null && !state.isPremium) {
            console.warn("Freemium users cannot edit default categories.");
            return state;
        }
      newState.categories = state.categories.map(cat =>
        cat.id === action.payload.id ? {...action.payload, userId: categoryToUpdate?.userId } : cat // Preserve original userId for defaults
      );
      break;
    case 'REMOVE_CATEGORY':
      const categoryToRemove = state.categories.find(c => c.id === action.payload.categoryId);
      if (categoryToRemove && categoryToRemove.userId === null && !state.isPremium) {
          console.warn("Freemium users cannot delete default categories.");
          return state;
      }
      if (categoryToRemove?.id === 'uncategorized') return state;

      newState.categories = state.categories.filter(cat => cat.id !== action.payload.categoryId);
      newState.shoppingListItems = state.shoppingListItems.map(item =>
        item.category === action.payload.categoryId
        ? { ...item, category: action.payload.reassignToId || 'uncategorized' }
        : item
      );
      newState.lists = state.lists.map(list =>
        list.defaultCategory === action.payload.categoryId
        ? { ...list, defaultCategory: action.payload.reassignToId || 'uncategorized' }
        : list
      );
      break;
    case 'SET_LOADING':
      newState = { ...state, isLoading: action.payload };
      break;
    case 'SET_PREMIUM_STATUS': // Handle premium status update
      newState = { ...state, isPremium: action.payload };
      break;
    default:
      newState = state;
  }

  if (action.type !== 'LOAD_STATE' && action.type !== 'LOAD_STATE_FROM_API' && typeof window !== 'undefined') {
    try {
      const stateToSave = { ...newState, isLoading: undefined, apiBaseUrl: undefined };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (error) {
      console.error("Failed to save state to localStorage:", error);
    }
  }
  return newState;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    const loadInitialData = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        let userIdFromStorage = localStorage.getItem('app_user_id_neon_shopping');
        if (!userIdFromStorage) {
          userIdFromStorage = uuidv4();
          localStorage.setItem('app_user_id_neon_shopping', userIdFromStorage);
        }

        let loadedState: Partial<AppState> = { userId: userIdFromStorage };
        const savedStateRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedStateRaw) {
          try {
            const parsedState = JSON.parse(savedStateRaw);
            loadedState = { ...parsedState, userId: userIdFromStorage }; // Ensure persisted userId is used
          } catch (e) {
            console.error("Failed to parse saved state, using defaults with new/existing userId:", e);
          }
        }
        
        if (!loadedState.currency) {
          try {
            const detectedCurrency = await getUserCurrency();
            loadedState.currency = detectedCurrency || defaultCurrency;
          } catch (e) {
            console.error("Failed to detect currency, using default:", e);
            loadedState.currency = defaultCurrency;
          }
        }
        // Ensure default categories are present if not loaded or if empty
        if (!loadedState.categories || loadedState.categories.length === 0) {
            loadedState.categories = DEFAULT_CATEGORIES;
        } else {
            // Merge default categories with loaded ones, ensuring no duplicates by name for defaults
            const defaultCategoryNames = new Set(DEFAULT_CATEGORIES.map(dc => dc.name.toLowerCase()));
            const customCategories = (loadedState.categories as Category[]).filter(lc => lc.userId !== null || !defaultCategoryNames.has(lc.name.toLowerCase()));
            loadedState.categories = [...DEFAULT_CATEGORIES, ...customCategories];
        }


        dispatch({ type: 'LOAD_STATE', payload: loadedState });
      } catch (error) {
        console.error("Error during initial data load:", error);
         dispatch({ type: 'LOAD_STATE', payload: { userId: localStorage.getItem('app_user_id_neon_shopping') || uuidv4(), currency: defaultCurrency, categories: DEFAULT_CATEGORIES } });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };
    loadInitialData();
  }, []);

  const formatCurrency = useCallback((amount: number) => {
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: state.currency.code,
      }).format(amount);
    } catch (error) {
      return `${state.currency.symbol || '$'}${amount.toFixed(2)}`;
    }
  }, [state.currency]);

  return (
    <AppContext.Provider value={{ state, dispatch, formatCurrency, isLoading: state.isLoading }}>
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
