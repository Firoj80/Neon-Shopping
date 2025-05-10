
"use client";

import React, { createContext, useContext, useReducer, useEffect, useState, useCallback, type ReactNode } from 'react';
import { format, startOfDay, isSameDay } from 'date-fns';
import { themes, defaultThemeId } from '@/config/themes';
import { v4 as uuidv4 } from 'uuid';
import { getUserCurrency, type Currency, defaultCurrency } from '@/services/currency';

const LOCAL_STORAGE_KEY = 'neonShoppingState_vLocal'; // Key for local storage
export const FREEMIUM_LIST_LIMIT = 3;

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
  dateAdded: number; // Timestamp
}

export interface List {
  id: string;
  userId: string;
  name: string;
  budgetLimit: number;
  defaultCategory?: string; // ID of a category
}

export interface Category {
  id: string;
  name: string;
  userId?: string; // User-specific if not default
}

// Define default categories - these are not user-specific initially
export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'grocery', name: 'Grocery' },
  { id: 'home', name: 'Home Appliances' },
  { id: 'health', name: 'Health' },
  { id: 'electronics', name: 'Electronics' },
  { id: 'fashion', name: 'Fashion' },
  { id: 'sports', name: 'Sports'},
  { id: 'uncategorized', name: 'Uncategorized' },
];


export interface AppState {
  userId: string | null;
  currency: Currency;
  theme: string;
  lists: List[];
  selectedListId: string | null;
  shoppingListItems: ShoppingListItem[];
  categories: Category[];
  isPremium: boolean;
  isInitialDataLoaded: boolean;
}

const initialState: AppState = {
  userId: null, // Will be loaded or generated
  currency: defaultCurrency,
  theme: defaultThemeId,
  lists: [],
  selectedListId: null,
  shoppingListItems: [],
  categories: DEFAULT_CATEGORIES,
  isPremium: false, // Default to non-premium
  isInitialDataLoaded: false,
};

// --- Actions ---
export type Action =
  | { type: 'LOAD_STATE'; payload: Partial<AppState> & { userId: string } } // Ensure userId is part of payload
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
  | { type: 'SET_PREMIUM_STATUS'; payload: boolean }
  | { type: 'SET_INITIAL_DATA_LOADED'; payload: boolean };


// --- Reducer ---
function appReducer(state: AppState, action: Action): AppState {
  let newState = { ...state };

  switch (action.type) {
    case 'LOAD_STATE':
      console.log("Reducer: LOAD_STATE", action.payload);
      newState = {
        ...state,
        ...action.payload,
        userId: action.payload.userId, // Ensure userId from payload is used
        // Keep other specific initializations if necessary
        currency: action.payload.currency || state.currency || defaultCurrency,
        theme: action.payload.theme || state.theme || defaultThemeId,
        lists: action.payload.lists || [],
        selectedListId: action.payload.selectedListId || (action.payload.lists && action.payload.lists.length > 0 ? action.payload.lists[0].id : null),
        shoppingListItems: action.payload.shoppingListItems || [],
        categories: action.payload.categories && action.payload.categories.length > 0 ? action.payload.categories : DEFAULT_CATEGORIES,
        isPremium: action.payload.isPremium !== undefined ? action.payload.isPremium : false,
        // isInitialDataLoaded is typically handled by a separate useState in AppProvider
      };
      // If userId was generated because it wasn't in localStorage or payload, save it.
      if (action.payload.userId && typeof window !== "undefined" && localStorage.getItem('user_id') !== action.payload.userId) {
        localStorage.setItem('user_id', action.payload.userId);
      }
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
      // Freemium check: Only allow adding if not exceeding limit or if premium
      if (!state.isPremium && state.lists.length >= FREEMIUM_LIST_LIMIT) {
        alert(`Free users can only create up to ${FREEMIUM_LIST_LIMIT} lists. Upgrade to premium for unlimited lists.`);
        return state; // Return current state if limit reached
      }
      newState = { ...state, lists: [...state.lists, action.payload] };
      // If it's the first list being added, select it.
      if (state.lists.length === 0) {
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
      // Check if item with same name already exists in the list for the current user
      const existingItem = state.shoppingListItems.find(
        item => item.listId === action.payload.listId &&
                item.name.toLowerCase() === action.payload.name.toLowerCase() &&
                !item.checked // Only consider non-checked items for duplication warning
      );
      if (existingItem) {
        // Optionally: alert user or handle as an update (e.g., increment quantity)
        // For now, let's just log and add it as a new item to avoid complex merge logic.
        // You might want to show a toast to the user: "Item already exists. Updated quantity?"
        console.warn("Adding item that already exists in the list:", action.payload.name);
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
      if (!state.userId) { // Categories are user-specific now
        console.error("Cannot add category: User ID is missing.");
        return state;
      }
      // Freemium check: only allow adding if premium
      if (!state.isPremium) {
         alert("Creating custom categories is a premium feature.");
         return state;
      }
      // Check for duplicates (case-insensitive) for the current user
      if (!state.categories.find(cat => cat.userId === state.userId && cat.name.toLowerCase() === action.payload.name.toLowerCase())) {
        newState = { ...state, categories: [...state.categories, { ...action.payload, userId: state.userId }] };
      } else {
        alert(`Category "${action.payload.name}" already exists.`);
      }
      break;
    case 'UPDATE_CATEGORY':
       if (!state.userId) {
        console.error("Cannot update category: User ID is missing.");
        return state;
      }
      // Freemium check: only allow editing if premium
      if (!state.isPremium) {
         alert("Editing categories is a premium feature.");
         return state;
      }
      newState = {
        ...state,
        categories: state.categories.map(cat =>
          cat.id === action.payload.id && cat.userId === state.userId ? { ...action.payload, userId: state.userId } : cat
        ),
      };
      break;
    case 'DELETE_CATEGORY':
      const categoryIdToDelete = action.payload;
      if (!state.userId) {
        console.error("Cannot delete category: User ID is missing.");
        return state;
      }
       // Freemium check: only allow deleting if premium
      if (!state.isPremium) {
         alert("Deleting categories is a premium feature.");
         return state;
      }
      // Prevent deleting default categories if not premium (or handle differently)
      const isDefaultCategory = DEFAULT_CATEGORIES.some(dc => dc.id === categoryIdToDelete);
      if (isDefaultCategory && !state.isPremium) {
        alert("Default categories cannot be deleted by free users.");
        return state;
      }

      const uncategorizedUser = state.categories.find(c => c.userId === state.userId && (c.id === 'uncategorized' || c.name.toLowerCase() === 'uncategorized'));
      const targetCategoryId = uncategorizedUser ? uncategorizedUser.id : (state.categories.find(c => c.id !== categoryIdToDelete && c.userId === state.userId)?.id || 'uncategorized'); // Fallback to string 'uncategorized' if no user-specific uncategorized exists

      newState = {
        ...state,
        categories: state.categories.filter(cat => !(cat.id === categoryIdToDelete && cat.userId === state.userId)),
        shoppingListItems: state.shoppingListItems.map(item =>
          item.userId === state.userId && item.category === categoryIdToDelete
            ? { ...item, category: targetCategoryId }
            : item
        ),
      };
      // Update defaultCategory in lists if it was the deleted category
      newState.lists = newState.lists.map(list =>
        list.userId === state.userId && list.defaultCategory === categoryIdToDelete
        ? { ...list, defaultCategory: targetCategoryId === 'uncategorized' && !uncategorizedUser ? undefined : targetCategoryId } // if target is generic uncategorized, make it undefined
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
      // newState = state; // Removed to avoid ESLint error, as all paths should return/assign newState
      break;
  }

  // Persist state to localStorage for relevant actions
  if (action.type !== 'LOAD_STATE' && action.type !== 'SET_INITIAL_DATA_LOADED' && typeof window !== 'undefined') {
    try {
      // Only save relevant parts, no need to save isInitialDataLoaded to localStorage
      const { isInitialDataLoaded, ...stateToSave } = newState;
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (error) {
      console.error("Failed to save state to localStorage:", error);
    }
  }
  return newState;
}


interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  isLoading: boolean; // This will be managed by AppProvider's local state
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [isLoading, setIsLoading] = useState(true); // Manages loading state for initial data fetch
  const [isInitialDataLoaded, setIsInitialDataLoaded] = useState(false);


  useEffect(() => {
    const loadInitialData = async () => {
      console.log("AppProvider: Initiating initial data load...");
      setIsLoading(true); // Set loading true at the start

      let userId = localStorage.getItem('user_id');
      if (!userId) {
        userId = `anon_${uuidv4()}`;
        localStorage.setItem('user_id', userId);
        console.log("AppProvider: Generated new anonymous user ID:", userId);
      } else {
        console.log("AppProvider: Found existing user ID:", userId);
      }

      let loadedStateFromStorage: Partial<AppState> = {};
      try {
        const savedStateRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedStateRaw) {
          const parsedState = JSON.parse(savedStateRaw);
           // Critical: Ensure parsedState.userId is not overriding the one from localStorage if they differ
           // This scenario (differing userId in LOCAL_STORAGE_KEY vs 'user_id') should ideally not happen
           // if saving logic is correct. We prioritize 'user_id' from localStorage.
          loadedStateFromStorage = { ...parsedState, userId: userId };
          console.log("AppProvider: Loaded state from localStorage for user:", userId, parsedState);
        } else {
          loadedStateFromStorage.userId = userId; // Ensure userId is set even if no other state
          console.log("AppProvider: No saved state found in localStorage for key:", LOCAL_STORAGE_KEY, "Using user ID:", userId);
        }
      } catch (error) {
        console.error("AppProvider: Failed to parse state from localStorage, using defaults with user ID:", userId, error);
        loadedStateFromStorage.userId = userId; // Ensure userId is set on error
      }
      
      // Auto-detect currency if not already set
      if (!loadedStateFromStorage.currency) {
        try {
          console.log("AppProvider: No currency in saved state, attempting auto-detection...");
          const detectedCurrency = await getUserCurrency();
          loadedStateFromStorage.currency = detectedCurrency || defaultCurrency;
          console.log("AppProvider: Currency set to:", loadedStateFromStorage.currency?.code);
        } catch (error) {
          console.error("AppProvider: Error during currency auto-detection, using default:", error);
          loadedStateFromStorage.currency = defaultCurrency;
        }
      } else {
         console.log("AppProvider: Using currency from saved state:", loadedStateFromStorage.currency.code);
      }
      
      // Ensure categories are present, defaulting if necessary
      const finalCategories = (loadedStateFromStorage.categories && loadedStateFromStorage.categories.length > 0)
        ? loadedStateFromStorage.categories
        : DEFAULT_CATEGORIES.map(cat => ({...cat, userId: cat.userId ? userId : undefined })); // Assign userId to default categories if they are user-specific by design
      loadedStateFromStorage.categories = finalCategories;

      // Ensure lists and items are at least empty arrays
      if (!loadedStateFromStorage.lists) loadedStateFromStorage.lists = [];
      if (!loadedStateFromStorage.shoppingListItems) loadedStateFromStorage.shoppingListItems = [];
      
      // Select first list if none selected and lists exist
      if (!loadedStateFromStorage.selectedListId && loadedStateFromStorage.lists.length > 0) {
        loadedStateFromStorage.selectedListId = loadedStateFromStorage.lists[0].id;
      }
      
      // Ensure the payload for LOAD_STATE has a userId
      const finalPayload: Partial<AppState> & { userId: string } = {
        ...initialState, // Start with initialState to ensure all AppState fields are present
        ...loadedStateFromStorage, // Override with loaded data
        userId: userId, // Explicitly ensure userId is set
      };

      dispatch({ type: 'LOAD_STATE', payload: finalPayload });
      setIsInitialDataLoaded(true); // Mark initial load as complete
      setIsLoading(false); // Set loading to false after all processing
      console.log("AppProvider: Initial data processing finished. Current user ID in context:", userId);
    };

    // Only run if initial data hasn't been loaded yet.
    if (!isInitialDataLoaded) {
       loadInitialData();
    }
  }, [isInitialDataLoaded]); // Depend on isInitialDataLoaded to prevent re-runs after load.

  // Provide a context value that includes the AppProvider's local isLoading state
  const contextValue = {
    state: { ...state, isInitialDataLoaded }, // Combine reducer state with local isInitialDataLoaded
    dispatch,
    isLoading, // This is the AppProvider's own loading state for initial data
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

