
"use client";

import React, { createContext, useContext, useReducer, useEffect, useState, useCallback, type ReactNode } from 'react';
import { format, startOfDay, isSameDay } from 'date-fns';
import { themes, defaultThemeId } from '@/config/themes';
import { v4 as uuidv4 } from 'uuid';
import { getUserCurrency, type Currency, defaultCurrency, समर्थितमुद्राएँ } from '@/services/currency';

const LOCAL_STORAGE_KEY = 'neonShoppingState_vLocal'; // Key for localStorage
export const FREEMIUM_LIST_LIMIT = 3; // This can still apply to local storage version

// --- Types ---
export interface ShoppingListItem {
  id: string;
  listId: string;
  userId: string; // This will be the generated anonymous userId
  name: string;
  quantity: number;
  price: number;
  category: string; // Category ID
  checked: boolean;
  dateAdded: number; // Timestamp
}

export interface List {
  id: string;
  userId: string;
  name: string;
  budgetLimit: number;
  defaultCategory?: string;
}

export interface Category {
  id: string;
  userId?: string; 
  name: string;
  isDefault?: boolean;
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'grocery', name: 'Grocery', isDefault: true },
  { id: 'home', name: 'Home Appliances', isDefault: true },
  { id: 'health', name: 'Health', isDefault: true },
  { id: 'electronics', name: 'Electronics', isDefault: true },
  { id: 'fashion', name: 'Fashion', isDefault: true },
  { id: 'sports', name: 'Sports', isDefault: true },
  { id: 'uncategorized', name: 'Uncategorized', isDefault: true },
];

export interface AppState {
  userId: string | null;
  currency: Currency;
  theme: string;
  lists: List[];
  selectedListId: string | null;
  shoppingListItems: ShoppingListItem[];
  categories: Category[];
  isPremium: boolean; // Keep for local freemium logic
  isInitialDataLoaded: boolean;
}

const initialState: AppState = {
  userId: null,
  currency: defaultCurrency,
  theme: defaultThemeId,
  lists: [],
  selectedListId: null,
  shoppingListItems: [],
  categories: DEFAULT_CATEGORIES.map(cat => ({ ...cat })),
  isPremium: false, // Default to false for local version
  isInitialDataLoaded: false,
};

// --- Actions ---
export type Action =
  | { type: 'LOAD_STATE'; payload: Partial<AppState> }
  | { type: 'SET_USER_ID'; payload: string | null }
  | { type: 'SET_CURRENCY'; payload: Currency }
  | { type: 'SET_THEME'; payload: string }
  | { type: 'ADD_LIST'; payload: List }
  | { type: 'UPDATE_LIST'; payload: List }
  | { type: 'DELETE_LIST'; payload: string }
  | { type: 'SELECT_LIST'; payload: string | null }
  | { type: 'ADD_SHOPPING_ITEM'; payload: ShoppingListItem }
  | { type: 'UPDATE_SHOPPING_ITEM'; payload: ShoppingListItem }
  | { type: 'DELETE_SHOPPING_ITEM'; payload: string }
  | { type: 'TOGGLE_ITEM_CHECKED'; payload: string }
  | { type: 'ADD_CATEGORY'; payload: Category }
  | { type: 'UPDATE_CATEGORY'; payload: Category }
  | { type: 'DELETE_CATEGORY'; payload: string }
  | { type: 'SET_PREMIUM_STATUS'; payload: boolean } // Can be used for local freemium
  | { type: 'SET_INITIAL_DATA_LOADED'; payload: boolean };

// --- Reducer ---
function appReducer(state: AppState, action: Action): AppState {
  let newState = { ...state };

  switch (action.type) {
    case 'LOAD_STATE':
      console.log('Reducer: LOAD_STATE', action.payload);
      newState = {
        ...state,
        ...action.payload,
        userId: action.payload.userId || state.userId,
        currency: action.payload.currency || state.currency || defaultCurrency,
        theme: action.payload.theme || state.theme || defaultThemeId,
        lists: action.payload.lists || [],
        selectedListId: action.payload.selectedListId || (action.payload.lists && action.payload.lists.length > 0 ? action.payload.lists[0].id : null),
        shoppingListItems: action.payload.shoppingListItems || [],
        categories: action.payload.categories && action.payload.categories.length > 0
                    ? action.payload.categories
                    : DEFAULT_CATEGORIES.map(cat => ({...cat, userId: action.payload.userId || undefined })),
        isPremium: action.payload.isPremium !== undefined ? action.payload.isPremium : state.isPremium,
        isInitialDataLoaded: true,
      };
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
      if (!state.userId) {
        console.error("Cannot add list: User ID is missing.");
        return state;
      }
      if (!state.isPremium && state.lists.length >= FREEMIUM_LIST_LIMIT) {
        alert(`Free users can only create up to ${FREEMIUM_LIST_LIMIT} lists.`);
        return state;
      }
      newState = { ...state, lists: [...state.lists, action.payload] };
      if (state.lists.length === 0 && action.payload) { // Ensure action.payload is defined
        newState.selectedListId = action.payload.id;
      }
      break;
    case 'UPDATE_LIST':
      newState = {
        ...state,
        lists: state.lists.map(list => list.id === action.payload.id ? action.payload : list),
      };
      break;
    case 'DELETE_LIST':
      const listIdToDelete = action.payload;
      const remainingLists = state.lists.filter(list => list.id !== listIdToDelete);
      let newSelectedListId = state.selectedListId;

      if (state.selectedListId === listIdToDelete) {
        newSelectedListId = remainingLists.length > 0 ? remainingLists[0].id : null;
      }
      newState = {
        ...state,
        lists: remainingLists,
        shoppingListItems: state.shoppingListItems.filter(item => item.listId !== listIdToDelete),
        selectedListId: newSelectedListId,
      };
      break;
    case 'SELECT_LIST':
      newState = { ...state, selectedListId: action.payload };
      break;
    case 'ADD_SHOPPING_ITEM': {
      if (!action.payload.listId || !action.payload.userId) {
        console.error("Attempted to add item without listId or userId", action.payload);
        return state;
      }
      const newItem: ShoppingListItem = { ...action.payload, dateAdded: Date.now() };
      newState = { ...state, shoppingListItems: [...state.shoppingListItems, newItem] };
      break;
    }
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
        shoppingListItems: state.shoppingListItems.filter(item => item.id !== action.payload),
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
    case 'ADD_CATEGORY':
      if (!state.userId) {
        console.error("Cannot add category: User ID is missing.");
        return state;
      }
      if (!state.isPremium && state.categories.filter(c => !c.isDefault).length >= 2) { // Example: limit custom categories for free
         alert("Free users can only create a limited number of custom categories.");
         return state;
      }
      const categoryToAdd = { ...action.payload, userId: state.userId, isDefault: false };
      if (!state.categories.find(cat => cat.name.toLowerCase() === categoryToAdd.name.toLowerCase() && (cat.userId === state.userId || cat.isDefault))) {
        newState = { ...state, categories: [...state.categories, categoryToAdd] };
      } else {
        alert(`Category "${categoryToAdd.name}" already exists.`);
      }
      break;
    case 'UPDATE_CATEGORY':
       if (!state.userId) {
        console.error("Cannot update category: User ID is missing.");
        return state;
      }
      const categoryToUpdate = state.categories.find(cat => cat.id === action.payload.id);
      if (categoryToUpdate?.isDefault && !state.isPremium) { // Example: prevent editing default for free
          alert("Editing default categories is a premium feature.");
          return state;
      }
      newState = {
        ...state,
        categories: state.categories.map(cat =>
          cat.id === action.payload.id ? { ...action.payload, userId: cat.userId, isDefault: cat.isDefault } : cat
        ),
      };
      break;
    case 'DELETE_CATEGORY':
      const categoryIdToDelete = action.payload;
      const catToDelete = state.categories.find(c => c.id === categoryIdToDelete);
      if (!catToDelete) return state;

      if (catToDelete.isDefault) {
        alert("Default categories cannot be deleted.");
        return state;
      }
       if (!state.isPremium && !catToDelete.isDefault) { // Example: prevent deleting custom for free
          alert("Deleting custom categories is a premium feature.");
          return state;
      }
      
      const uncategorizedUserCategory = state.categories.find(c => (c.id === 'uncategorized' || c.name.toLowerCase() === 'uncategorized'));
      const targetCategoryId = uncategorizedUserCategory!.id;

      newState = {
        ...state,
        categories: state.categories.filter(cat => cat.id !== categoryIdToDelete),
        shoppingListItems: state.shoppingListItems.map(item =>
          item.category === categoryIdToDelete
            ? { ...item, category: targetCategoryId }
            : item
        ),
      };
      newState.lists = newState.lists.map(list =>
        list.defaultCategory === categoryIdToDelete
        ? { ...list, defaultCategory: targetCategoryId }
        : list
      );
      break;
    case 'SET_PREMIUM_STATUS':
      newState = { ...state, isPremium: action.payload };
      break;
    case 'SET_INITIAL_DATA_LOADED':
      newState = { ...state, isInitialDataLoaded: action.payload };
      break;
    default:
      break;
  }

  if (action.type !== 'LOAD_STATE' && typeof window !== 'undefined' && newState.userId) {
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
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialDataLoadedLocal, setIsInitialDataLoadedLocal] = useState(false);


  useEffect(() => {
    const loadInitialData = async () => {
      console.log("AppProvider: Loading initial data (localStorage focus)...");
      setIsLoading(true);

      let anonUserId = localStorage.getItem('app_user_id_local');
      if (!anonUserId) {
        anonUserId = `anon_${uuidv4()}`;
        localStorage.setItem('app_user_id_local', anonUserId);
        console.log("AppProvider: Generated new anonymous user ID:", anonUserId);
      } else {
        console.log("AppProvider: Found existing anonymous user ID:", anonUserId);
      }

      let loadedStateFromStorage: Partial<AppState> = {};
      try {
        const savedStateRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedStateRaw) {
          loadedStateFromStorage = JSON.parse(savedStateRaw);
          console.log("AppProvider: Loaded state from localStorage.");
        } else {
          console.log("AppProvider: No saved state in localStorage.");
        }
      } catch (error) {
        console.error("AppProvider: Failed to parse state from localStorage:", error);
        // If parsing fails, we'll proceed with defaults below
      }
      
      let finalCurrency = loadedStateFromStorage.currency || defaultCurrency;
      if (!loadedStateFromStorage.currency) { // Only detect if not already in local storage
        try {
          const detectedCurrency = await getUserCurrency();
          finalCurrency = detectedCurrency || defaultCurrency;
          console.log("AppProvider: Currency auto-detected:", finalCurrency.code);
        } catch (error) {
          console.error("AppProvider: Currency auto-detection failed:", error);
        }
      }
      
      const categoriesForUser = (loadedStateFromStorage.categories && loadedStateFromStorage.categories.length > 0)
        ? loadedStateFromStorage.categories
        : DEFAULT_CATEGORIES.map(cat => ({ ...cat, userId: anonUserId }));

      dispatch({
        type: 'LOAD_STATE',
        payload: {
          ...initialState, // Start with a clean slate for structure
          ...loadedStateFromStorage, // Override with any saved data
          userId: anonUserId, // Ensure this specific anonUserId is used
          currency: finalCurrency,
          theme: loadedStateFromStorage.theme || defaultThemeId, // Load saved theme or default
          categories: categoriesForUser,
          isPremium: loadedStateFromStorage.isPremium || false, // Load saved premium or default
          isInitialDataLoaded: true,
        },
      });
      setIsInitialDataLoadedLocal(true); // Local flag to prevent re-running this specific effect
      setIsLoading(false); 
      console.log("AppProvider: Initial data processing finished. Current user ID in context:", anonUserId);
    };

    if (!isInitialDataLoadedLocal && typeof window !== 'undefined') { // Ensure it runs only once and client-side
       loadInitialData();
    } else if (isInitialDataLoadedLocal) {
        setIsLoading(false); // If already loaded, ensure loading is false
    }
  }, [isInitialDataLoadedLocal]);


  const contextValue = {
    state, 
    dispatch,
    isLoading,
  };

  return (
    <AppContext.Provider value={contextValue}>
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
