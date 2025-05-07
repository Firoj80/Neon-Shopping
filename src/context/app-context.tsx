"use client";
import type React from 'react';
import { createContext, useContext, useReducer, useEffect, useState, useCallback } from 'react';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

// --- Types ---
export interface Currency {
  code: string;
  symbol: string;
  name: string;
}

export interface List {
  id: string;
  name: string;
  budgetLimit: number;
  defaultCategory?: string;
}

export interface BudgetItem { // Simplified for local storage
  limit: number;
  spent: number; // Typically calculated daily or per list based on items
  lastSetDate: string | null; // Could be used for daily budget reset
}

export interface Category {
  id: string;
  name: string;
}

export interface ShoppingListItem {
  id: string;
  listId: string;
  name: string;
  quantity: number;
  price: number;
  category: string;
  checked: boolean;
  dateAdded: number; // Timestamp
}

interface AppState {
  userId: string; // For local storage keying, not for backend auth
  currency: Currency;
  lists: List[];
  selectedListId: string | null;
  shoppingListItems: ShoppingListItem[];
  categories: Category[];
  // isPremium: boolean; // Removed, as complex auth/premium features are out
  // theme: string; // Removed theme state
}

type Action =
  | { type: 'SET_CURRENCY'; payload: Currency }
  | { type: 'ADD_LIST'; payload: { name: string; budgetLimit: number; defaultCategory?: string } }
  | { type: 'UPDATE_LIST'; payload: List }
  | { type: 'DELETE_LIST'; payload: string }
  | { type: 'SELECT_LIST'; payload: string | null }
  | { type: 'ADD_SHOPPING_ITEM'; payload: Omit<ShoppingListItem, 'id' | 'dateAdded'> }
  | { type: 'UPDATE_SHOPPING_ITEM'; payload: ShoppingListItem }
  | { type: 'REMOVE_SHOPPING_ITEM'; payload: string }
  | { type: 'TOGGLE_SHOPPING_ITEM'; payload: string }
  | { type: 'ADD_CATEGORY'; payload: { name: string } }
  | { type: 'UPDATE_CATEGORY'; payload: { id: string; name: string } }
  | { type: 'REMOVE_CATEGORY'; payload: { categoryId: string; reassignToId?: string } }
  // | { type: 'SET_PREMIUM'; payload: boolean } // Removed
  // | { type: 'SET_THEME'; payload: string } // Removed
  | { type: 'LOAD_STATE'; payload: Partial<AppState> & { userId: string } };

// --- Initial State & Reducer ---
const defaultCurrency: Currency = { code: 'USD', symbol: '$', name: 'US Dollar' };
const DEFAULT_CATEGORIES: Category[] = [
  { id: 'grocery', name: 'Grocery' },
  { id: 'home', name: 'Home' },
  { id: 'health', name: 'Health' },
  { id: 'electronics', name: 'Electronics' },
  { id: 'sports', name: 'Sports' },
];

const INITIAL_LISTS: List[] = [];

const initialState: AppState = {
  userId: '', // Will be set to UUID on load
  currency: defaultCurrency,
  lists: INITIAL_LISTS,
  selectedListId: null,
  shoppingListItems: [],
  categories: DEFAULT_CATEGORIES,
  // isPremium: false, // Removed
  // theme: 'cyberpunk-cyan', // Removed
};

const LOCAL_STORAGE_KEY_PREFIX = 'neonShoppingAppState_pure_'; // Unique prefix for this version
const USER_ID_KEY = 'neonShoppingUserId_pure_';


function appReducer(state: AppState, action: Action): AppState {
  let newState: AppState;

  switch (action.type) {
    case 'SET_CURRENCY':
      newState = { ...state, currency: action.payload };
      break;
    case 'ADD_LIST': {
      const newList: List = {
        id: uuidv4(),
        name: action.payload.name,
        budgetLimit: action.payload.budgetLimit,
        defaultCategory: action.payload.defaultCategory,
      };
      newState = { ...state, lists: [...state.lists, newList], selectedListId: newList.id };
      break;
    }
    case 'UPDATE_LIST': {
      newState = {
        ...state,
        lists: state.lists.map(list => list.id === action.payload.id ? action.payload : list),
      };
      break;
    }
    case 'DELETE_LIST': {
      const listIdToDelete = action.payload;
      const remainingLists = state.lists.filter(list => list.id !== listIdToDelete);
      const newSelectedListId = state.selectedListId === listIdToDelete
        ? (remainingLists.length > 0 ? remainingLists[0].id : null)
        : state.selectedListId;
      newState = {
        ...state,
        lists: remainingLists,
        shoppingListItems: state.shoppingListItems.filter(item => item.listId !== listIdToDelete),
        selectedListId: newSelectedListId,
      };
      break;
    }
    case 'SELECT_LIST':
      newState = { ...state, selectedListId: action.payload };
      break;
    case 'ADD_SHOPPING_ITEM': {
      if (!action.payload.listId) {
        console.error("Attempted to add item without listId");
        return state; // Or handle error appropriately
      }
      const newItem: ShoppingListItem = {
        ...action.payload,
        id: uuidv4(),
        dateAdded: Date.now(),
      };
      newState = { ...state, shoppingListItems: [newItem, ...state.shoppingListItems] };
      break;
    }
    case 'UPDATE_SHOPPING_ITEM': {
      newState = {
        ...state,
        shoppingListItems: state.shoppingListItems.map((item) =>
          item.id === action.payload.id ? action.payload : item
        ),
      };
      break;
    }
    case 'REMOVE_SHOPPING_ITEM': {
      newState = {
        ...state,
        shoppingListItems: state.shoppingListItems.filter((item) => item.id !== action.payload),
      };
      break;
    }
    case 'TOGGLE_SHOPPING_ITEM': {
      newState = {
        ...state,
        shoppingListItems: state.shoppingListItems.map((item) =>
          item.id === action.payload ? { ...item, checked: !item.checked } : item
        ),
      };
      break;
    }
    case 'ADD_CATEGORY': {
      const newCategory: Category = {
        id: uuidv4(),
        name: action.payload.name,
      };
      newState = { ...state, categories: [...state.categories, newCategory] };
      break;
    }
    case 'UPDATE_CATEGORY': {
      newState = {
        ...state,
        categories: state.categories.map(cat =>
          cat.id === action.payload.id ? { ...cat, name: action.payload.name } : cat
        )
      };
      break;
    }
    case 'REMOVE_CATEGORY': {
      const { categoryId, reassignToId } = action.payload;
      const remainingCategories = state.categories.filter(cat => cat.id !== categoryId);
      let updatedShoppingListItems = state.shoppingListItems;
      if (reassignToId) {
        updatedShoppingListItems = state.shoppingListItems.map(item =>
          item.category === categoryId ? { ...item, category: reassignToId } : item
        );
      } else {
         // Fallback to a generic 'uncategorized' or handle as per app logic
         updatedShoppingListItems = state.shoppingListItems.map(item =>
            item.category === categoryId ? { ...item, category: 'uncategorized' } : item
          );
      }
      newState = { ...state, categories: remainingCategories, shoppingListItems: updatedShoppingListItems };
      break;
    }
    case 'LOAD_STATE': {
      const loadedUserId = action.payload.userId || uuidv4(); // Ensure userId is always present
      const loadedLists = action.payload.lists && action.payload.lists.length > 0 ? action.payload.lists : INITIAL_LISTS;
      newState = {
        ...initialState, // Start from a clean slate
        ...action.payload, // Apply loaded data
        userId: loadedUserId,
        lists: loadedLists,
        selectedListId: action.payload.selectedListId || (loadedLists.length > 0 ? loadedLists[0].id : null),
        categories: action.payload.categories && action.payload.categories.length > 0 ? action.payload.categories : DEFAULT_CATEGORIES,
        currency: action.payload.currency || defaultCurrency,
      };
      break;
    }
    default:
      newState = state;
  }

  // Save to localStorage after every action except initial load
  if (action.type !== 'LOAD_STATE' && typeof window !== 'undefined' && state.userId) {
    try {
      const userSpecificStorageKey = `${LOCAL_STORAGE_KEY_PREFIX}${state.userId}`;
      localStorage.setItem(userSpecificStorageKey, JSON.stringify(newState));
    } catch (error) {
      console.error("Failed to save state to localStorage:", error);
    }
  }
  return newState;
}

// --- Context & Provider ---
interface AppContextProps {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  formatCurrency: (amount: number) => string;
  isLoading: boolean;
}

export const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [isLoading, setIsLoading] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadInitialData = () => {
      setIsLoading(true);
      let loadedStateFromStorage: Partial<AppState> = {};
      let userIdFromStorage: string | null = null;

      try {
        if (typeof window !== 'undefined') {
          userIdFromStorage = localStorage.getItem(USER_ID_KEY);
          if (!userIdFromStorage) {
            userIdFromStorage = uuidv4();
            localStorage.setItem(USER_ID_KEY, userIdFromStorage);
          }

          const userSpecificStorageKey = `${LOCAL_STORAGE_KEY_PREFIX}${userIdFromStorage}`;
          const savedStateRaw = localStorage.getItem(userSpecificStorageKey);

          if (savedStateRaw) {
            try {
              const parsedState = JSON.parse(savedStateRaw);
              if (typeof parsedState === 'object' && parsedState !== null) {
                // Explicitly map properties to ensure correct types and structure
                loadedStateFromStorage = {
                  currency: parsedState.currency,
                  lists: parsedState.lists,
                  selectedListId: parsedState.selectedListId,
                  shoppingListItems: parsedState.shoppingListItems,
                  categories: parsedState.categories,
                  // No theme or premium status to load in this version
                };
              }
            } catch (e) {
              console.error("Failed to parse saved state, resetting for user:", userIdFromStorage, e);
              // Optionally, clear the corrupted state
              localStorage.removeItem(userSpecificStorageKey);
            }
          }
        } else {
          // Fallback for non-browser environments (shouldn't happen in pure Next.js client-side)
          userIdFromStorage = uuidv4();
        }

        if (isMounted) {
          dispatch({ type: 'LOAD_STATE', payload: { ...loadedStateFromStorage, userId: userIdFromStorage } });
          setIsHydrated(true);
        }

      } catch (error) {
        console.error("Failed to load initial data:", error);
        if (isMounted) {
           // Ensure a userId is always generated and dispatched even on error
          let finalUserId = userIdFromStorage || (typeof window !== 'undefined' ? localStorage.getItem(USER_ID_KEY) : null) || uuidv4();
          if (typeof window !== 'undefined' && !localStorage.getItem(USER_ID_KEY)) localStorage.setItem(USER_ID_KEY, finalUserId);

          dispatch({ type: 'LOAD_STATE', payload: { userId: finalUserId } });
          setIsHydrated(true);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    loadInitialData();
    return () => { isMounted = false; };
  }, []); // Empty dependency array ensures this runs once on mount

  const formatCurrency = useCallback((amount: number): string => {
    try {
      return new Intl.NumberFormat(undefined, { // Use user's locale for formatting
        style: 'currency',
        currency: state.currency.code,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch (error) {
      // Fallback if Intl or currency code is problematic
      console.warn("Error formatting currency, falling back to default:", error);
      return `${state.currency.symbol}${amount.toFixed(2)}`;
    }
  }, [state.currency]);

  const contextValue: AppContextProps = {
    state,
    dispatch,
    formatCurrency,
    isLoading: isLoading || !isHydrated, // Consider both loading and hydration state
  };

  if (!isHydrated) {
      // Optionally return a global loader or null during server render / pre-hydration
      // to prevent hydration mismatches if initial state relies on localStorage.
      // For simplicity, we render children, but be mindful of components relying on context immediately.
  }

  return (
    <AppContext.Provider value={contextValue}>
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
