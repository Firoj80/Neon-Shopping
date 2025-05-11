"use client";

import React, { createContext, useContext, useReducer, useEffect, useState, useCallback, type ReactNode } from 'react';
import { format, startOfDay } from 'date-fns'; // Removed isSameDay as it's not used
import { v4 as uuidv4 } from 'uuid';
import { getUserCurrency, type Currency } from '@/services/currency';
import { defaultThemeId } from '@/config/themes';

const LOCAL_STORAGE_KEY = 'neonShoppingState_vLocal_anon'; // Key for anonymous local storage
export const FREEMIUM_LIST_LIMIT = 3;
export const FREEMIUM_CATEGORY_LIMIT = 5;

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'uncategorized', name: 'Uncategorized', userId: null }, // userId null for default global categories
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
  userId: string; // Will be the anonymous app_user_id
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
  userId: string | null; // null for default, or anonymous userId for user-created
}

export interface List {
  id: string;
  userId: string; // Will be the anonymous app_user_id
  name: string;
  budgetLimit: number;
  defaultCategory: string;
}

interface BudgetItem {
  limit: number;
  spent: number;
  lastSetDate: string | null;
}

interface AppState {
  userId: string; // Anonymous user ID
  currency: Currency;
  lists: List[];
  selectedListId: string | null;
  shoppingListItems: ShoppingListItem[];
  categories: Category[];
  theme: string;
  budget: BudgetItem; // Simplified budget directly in AppState
  isLoading: boolean;
  isInitialDataLoaded: boolean;
  // isPremium: boolean; // Removed premium flag
}

interface AppContextProps {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  formatCurrency: (amount: number) => string;
  isLoading: boolean; // Propagate loading state
}

const defaultCurrency: Currency = { code: 'USD', symbol: '$', name: 'US Dollar' };

const initialState: AppState = {
  userId: '', // Will be set to anonymous ID on initial load
  currency: defaultCurrency,
  lists: [],
  selectedListId: null,
  shoppingListItems: [],
  categories: [...DEFAULT_CATEGORIES], // Start with default categories
  theme: defaultThemeId,
  budget: { limit: 0, spent: 0, lastSetDate: null },
  isLoading: true,
  isInitialDataLoaded: false,
  // isPremium: true, // Removed
};

type Action =
  | { type: 'LOAD_STATE'; payload: Partial<Omit<AppState, 'isLoading' | 'isInitialDataLoaded'>> & { userId: string } }
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
  | { type: 'SET_BUDGET'; payload: BudgetItem }
  | { type: 'SET_LOADING'; payload: boolean };


const mergeCategories = (defaultCats: Category[], storedCats: Category[] | undefined, currentUserId: string): Category[] => {
  const categoryMap = new Map<string, Category>();
  // Add default categories first (userId is null)
  defaultCats.forEach(cat => categoryMap.set(cat.id, { ...cat, userId: null }));
  // Add/overwrite with stored categories if they belong to the current user or are global
  if (storedCats) {
    storedCats.forEach(cat => {
      if (cat.userId === currentUserId || cat.userId === null) { // Allow user's own or global defaults
        categoryMap.set(cat.id, cat);
      }
    });
  }
  return Array.from(categoryMap.values());
};


function appReducer(state: AppState, action: Action): AppState {
  let newState = { ...state };

  switch (action.type) {
    case 'LOAD_STATE':
      const { userId: loadedUserId, ...restOfPayload } = action.payload;
      newState = {
        ...initialState, // Reset to initial state first
        ...restOfPayload, // Then apply loaded state
        userId: loadedUserId, // Crucial: set the determined userId
        currency: restOfPayload.currency || initialState.currency,
        categories: mergeCategories(DEFAULT_CATEGORIES, restOfPayload.categories, loadedUserId),
        theme: restOfPayload.theme || initialState.theme,
        budget: restOfPayload.budget || initialState.budget,
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
      // Ensure new list has the current anonymous userId
      const newListWithUserId = { ...action.payload, userId: state.userId };
      newState.lists = [...state.lists, newListWithUserId];
      if (state.lists.filter(l => l.userId === state.userId).length === 0) { // If it's the first list for this user
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
       // Allow selecting if the list belongs to the current user or if deselecting (payload is null)
      if (action.payload === null || (listToSelect && listToSelect.userId === state.userId)) {
        newState.selectedListId = action.payload;
      }
      break;
    case 'ADD_SHOPPING_ITEM':
      // Ensure item has current anonymous userId
      if (action.payload.listId && action.payload.userId === state.userId) { // Ensure item belongs to current user
          const newItemWithUserId: ShoppingListItem = {
            ...action.payload,
            id: uuidv4(),
            userId: state.userId, // Enforce current user ID
            dateAdded: Date.now(),
            checked: false,
          };
          newState.shoppingListItems = [...state.shoppingListItems, newItemWithUserId];
      } else {
         console.error("Attempted to add item without listId or for a different userId.");
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
        userId: state.userId, // Tie user-created category to the current anonymous user
      };
      newState.categories = [...state.categories, newCategory];
      break;
    case 'UPDATE_CATEGORY':
      const categoryToUpdate = state.categories.find(c => c.id === action.payload.id);
      // Allow updating if it's a user-created category OR a global default category
      if (categoryToUpdate && (categoryToUpdate.userId === state.userId || categoryToUpdate.userId === null)) {
        newState.categories = state.categories.map(cat =>
          cat.id === action.payload.id ? { ...cat, name: action.payload.name } : cat
        );
      }
      break;
    case 'REMOVE_CATEGORY':
      const categoryToRemove = state.categories.find(c => c.id === action.payload.categoryId);
      if (categoryToRemove && categoryToRemove.id !== 'uncategorized') {
        // Only allow removal if it's a user-created category (not a global default one where userId is null)
        if (categoryToRemove.userId === state.userId) {
          newState.categories = state.categories.filter(cat => cat.id !== action.payload.categoryId);
          const reassignId = action.payload.reassignToId || 'uncategorized';
          // Reassign items and list defaults only for items/lists belonging to the current user
          newState.shoppingListItems = state.shoppingListItems.map(item =>
            item.category === action.payload.categoryId && item.userId === state.userId ? { ...item, category: reassignId } : item
          );
          newState.lists = state.lists.map(list =>
            list.defaultCategory === action.payload.categoryId && list.userId === state.userId ? { ...list, defaultCategory: reassignId } : list
          );
        } else {
          console.warn("Attempted to remove a default category or a category not belonging to the user.");
        }
      }
      break;
    case 'SET_THEME':
      newState.theme = action.payload;
      break;
    case 'SET_BUDGET': // For the simplified global budget
      newState.budget = action.payload;
      break;
    case 'SET_LOADING':
      newState.isLoading = action.payload;
      break;
    default:
      return state;
  }

  // Save to localStorage after every relevant action for the current anonymous user
  if (typeof window !== 'undefined' && action.type !== 'LOAD_STATE' && action.type !== 'SET_LOADING') {
    try {
      // Create a unique key for the anonymous user based on their generated ID
      const userSpecificStorageKey = `${LOCAL_STORAGE_KEY}_${state.userId}`;
      const { isLoading: _omittedIsLoading, isInitialDataLoaded: _omittedIsInitial, ...stateToSave } = newState;
      localStorage.setItem(userSpecificStorageKey, JSON.stringify(stateToSave));
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
      console.log("AppProvider: Loading initial data (anonymous or from localStorage)...");

      let userId = localStorage.getItem('app_user_id'); // Generic key for anonymous user ID
      if (!userId) {
        userId = `anon_${uuidv4()}`; // Prefix to clearly identify anonymous users
        localStorage.setItem('app_user_id', userId);
        console.log("AppProvider: Generated new anonymous user ID:", userId);
      } else {
        console.log("AppProvider: Found existing anonymous user ID:", userId);
      }

      let loadedStateFromStorage: Partial<Omit<AppState, 'isLoading' | 'isInitialDataLoaded' | 'userId'>> = {};
      const userSpecificStorageKey = `${LOCAL_STORAGE_KEY}_${userId}`;
      const storedStateRaw = localStorage.getItem(userSpecificStorageKey);

      if (storedStateRaw) {
        try {
          loadedStateFromStorage = JSON.parse(storedStateRaw);
          console.log("AppProvider: Loaded state from localStorage for user:", userId, loadedStateFromStorage);
        } catch (e) {
          console.error("AppProvider: Failed to parse stored state, resetting for user:", userId, e);
          localStorage.removeItem(userSpecificStorageKey);
        }
      } else {
        console.log("AppProvider: No saved state found in localStorage for user:", userId);
      }

      let currencyToSet = defaultCurrency;
      if (loadedStateFromStorage.currency) {
        currencyToSet = loadedStateFromStorage.currency;
      } else {
        try {
          const detectedCurrency = await getUserCurrency();
          if (detectedCurrency) {
            currencyToSet = detectedCurrency;
            console.log("AppProvider: Currency auto-detected:", currencyToSet);
          } else {
            console.log("AppProvider: Currency auto-detection failed, using default.");
          }
        } catch (e) {
          console.error("AppProvider: Currency auto-detection failed:", e);
        }
      }
      
      const finalPayload = {
        ...initialState, // Start with defaults to ensure all fields are present
        ...loadedStateFromStorage, // Override with stored data
        userId: userId, // Ensure this is correctly set
        currency: currencyToSet,
        theme: loadedStateFromStorage.theme || defaultThemeId,
        categories: mergeCategories(DEFAULT_CATEGORIES, loadedStateFromStorage.categories, userId),
        // Ensure lists and items are filtered for the current user if somehow mixed data was stored (defensive)
        lists: (loadedStateFromStorage.lists || []).filter(l => l.userId === userId),
        shoppingListItems: (loadedStateFromStorage.shoppingListItems || []).filter(i => i.userId === userId),
      };

      dispatch({ type: 'LOAD_STATE', payload: finalPayload });
      setIsInitialDataLoaded(true);
      setIsLoading(false);
      console.log("AppProvider: Initial data load finished. Current user ID in context:", finalPayload.userId);
    };

    loadInitialData();
  }, [isInitialDataLoaded]); // Only run once on mount

  const formatCurrency = useCallback((amount: number) => {
    try {
      return new Intl.NumberFormat(undefined, { // Use user's locale for formatting
        style: 'currency',
        currency: state.currency.code,
      }).format(amount);
    } catch (error) {
      console.warn("Currency formatting error for code:", state.currency.code, error);
      return `${state.currency.symbol || '$'}${amount.toFixed(2)}`;
    }
  }, [state.currency]);

  return (
    <AppContext.Provider value={{ state: { ...state, isLoading: isLoading || state.isLoading }, dispatch, formatCurrency, isLoading: isLoading || state.isLoading }}>
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
