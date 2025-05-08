"use client";
import type React from 'react';
import { createContext, useContext, useReducer, useEffect, useState, useCallback } from 'react';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { getSupportedCurrencies, getUserCurrency } from '@/services/currency'; // Import currency services

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
  userId: string; // Anonymous user ID
  currency: Currency;
  lists: List[];
  selectedListId: string | null;
  shoppingListItems: ShoppingListItem[];
  categories: Category[];
  // Removed theme state
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
  | { type: 'LOAD_STATE'; payload: Partial<AppState> & { userId: string } }; // userId is mandatory for load


// --- Initial State & Reducer ---
const defaultCurrency: Currency = { code: 'USD', symbol: '$', name: 'US Dollar' };
const DEFAULT_CATEGORIES: Category[] = [
  { id: 'grocery', name: 'Grocery' },
  { id: 'home', name: 'Home' },
  { id: 'health', name: 'Health' },
  { id: 'electronics', name: 'Electronics' },
  { id: 'sports', name: 'Sports' },
  { id: 'uncategorized', name: 'Uncategorized' },
];

const USER_ID_KEY = 'neonShoppingUserId_v3'; // Updated key version
const LOCAL_STORAGE_KEY_PREFIX = 'neonShoppingAppState_v3_'; // Updated key version

const initialState: AppState = {
  userId: '', // Will be set on load
  currency: defaultCurrency,
  lists: [], // Start with no lists
  selectedListId: null,
  shoppingListItems: [],
  categories: DEFAULT_CATEGORIES,
};

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
        defaultCategory: action.payload.defaultCategory || 'uncategorized',
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
        return state;
      }
      const newItem: ShoppingListItem = {
        ...action.payload,
        id: uuidv4(),
        dateAdded: Date.now(),
        checked: false,
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
          item.id === action.payload
            ? { ...item, checked: !item.checked, dateAdded: !item.checked ? Date.now() : item.dateAdded }
            : item
        ),
      };
      break;
    }
    case 'ADD_CATEGORY': {
      const newCategory: Category = {
        id: uuidv4(),
        name: action.payload.name,
      };
      if (state.categories.some(cat => cat.name.toLowerCase() === newCategory.name.toLowerCase())) {
        console.warn("Attempted to add duplicate category name:", newCategory.name);
        return state;
      }
      newState = { ...state, categories: [...state.categories, newCategory] };
      break;
    }
    case 'UPDATE_CATEGORY': {
      if (state.categories.some(cat => cat.id !== action.payload.id && cat.name.toLowerCase() === action.payload.name.toLowerCase())) {
        console.warn("Attempted to rename category to an existing name:", action.payload.name);
        return state;
      }
      newState = {
        ...state,
        categories: state.categories.map(cat =>
          cat.id === action.payload.id ? { ...cat, name: action.payload.name } : cat
        )
      };
      break;
    }
    case 'REMOVE_CATEGORY': {
      const { categoryId, reassignToId = 'uncategorized' } = action.payload;
      const remainingCategories = state.categories.filter(cat => cat.id !== categoryId);
      const updatedShoppingListItems = state.shoppingListItems.map(item =>
        item.category === categoryId ? { ...item, category: reassignToId } : item
      );
      newState = { ...state, categories: remainingCategories, shoppingListItems: updatedShoppingListItems };
      break;
    }
    case 'LOAD_STATE': {
      const loadedUserId = action.payload.userId || uuidv4(); // Ensure userId exists
      const loadedLists = Array.isArray(action.payload.lists) ? action.payload.lists : []; // Default to empty array
      const loadedItems = Array.isArray(action.payload.shoppingListItems) ? action.payload.shoppingListItems : [];
      const loadedCategories = Array.isArray(action.payload.categories) && action.payload.categories.length > 0
                               ? action.payload.categories
                               : DEFAULT_CATEGORIES;

      // Keep previously loaded currency if available, otherwise use default
      const loadedCurrency = action.payload.currency || state.currency || defaultCurrency;

      const validSelectedListId = loadedLists.find(l => l.id === action.payload.selectedListId)?.id || (loadedLists.length > 0 ? loadedLists[0].id : null);

      newState = {
        ...initialState, // Start from a clean default slate
        userId: loadedUserId,
        currency: loadedCurrency, // Use loaded or default currency
        lists: loadedLists,
        selectedListId: validSelectedListId,
        shoppingListItems: loadedItems,
        categories: loadedCategories,
      };
      break;
    }
    default:
      newState = state;
  }

  // Save to localStorage after every relevant action if userId exists
  if (action.type !== 'LOAD_STATE' && typeof window !== 'undefined' && state.userId) {
    try {
      const userSpecificStorageKey = `${LOCAL_STORAGE_KEY_PREFIX}${state.userId}`;
      const stateToSave = {
        currency: newState.currency,
        lists: newState.lists,
        selectedListId: newState.selectedListId,
        shoppingListItems: newState.shoppingListItems,
        categories: newState.categories,
      };
      localStorage.setItem(userSpecificStorageKey, JSON.stringify(stateToSave));
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

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [isLoading, setIsLoading] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadInitialData = async () => { // Make async
      setIsLoading(true);
      let loadedStateFromStorage: Partial<AppState> = {};
      let finalUserId: string | null = null;
      let finalCurrency: Currency | null = null;

      try {
        if (typeof window !== 'undefined') {
          // 1. Get or generate User ID
          finalUserId = localStorage.getItem(USER_ID_KEY);
          if (!finalUserId) {
            finalUserId = uuidv4();
            localStorage.setItem(USER_ID_KEY, finalUserId);
          }

          const userSpecificStorageKey = `${LOCAL_STORAGE_KEY_PREFIX}${finalUserId}`;
          const savedStateRaw = localStorage.getItem(userSpecificStorageKey);

          if (savedStateRaw) {
            try {
              const parsedState = JSON.parse(savedStateRaw);
              if (typeof parsedState === 'object' && parsedState !== null) {
                // Explicitly load only the expected keys
                loadedStateFromStorage = {
                  lists: parsedState.lists,
                  selectedListId: parsedState.selectedListId,
                  shoppingListItems: parsedState.shoppingListItems,
                  categories: parsedState.categories,
                };
                // Try loading currency from stored state first
                if (parsedState.currency && parsedState.currency.code) {
                    finalCurrency = parsedState.currency;
                }
              }
            } catch (e) {
              console.error("Failed to parse saved state, resetting for user:", finalUserId, e);
              localStorage.removeItem(userSpecificStorageKey);
            }
          }

          // 2. Attempt Currency Detection if not already loaded from storage
          if (!finalCurrency) {
              console.log("No currency in local storage, attempting auto-detection...");
              const detectedCurrency = await getUserCurrency();
              if (detectedCurrency) {
                  finalCurrency = detectedCurrency;
                  console.log("Auto-detected currency:", detectedCurrency.code);
                  // Save detected currency immediately
                  localStorage.setItem(userSpecificStorageKey, JSON.stringify({ ...loadedStateFromStorage, currency: finalCurrency }));
              } else {
                  finalCurrency = defaultCurrency;
                  console.log("Auto-detection failed, using default currency:", defaultCurrency.code);
                  // Save default currency immediately
                  localStorage.setItem(userSpecificStorageKey, JSON.stringify({ ...loadedStateFromStorage, currency: finalCurrency }));
              }
          } else {
              console.log("Loaded currency from local storage:", finalCurrency.code);
          }
        } else {
          // Fallback for non-browser environments
          finalUserId = uuidv4();
          finalCurrency = defaultCurrency; // Use default if no browser env
        }

        if (isMounted) {
          // Dispatch LOAD_STATE with all loaded/generated data
          dispatch({ type: 'LOAD_STATE', payload: { ...loadedStateFromStorage, userId: finalUserId!, currency: finalCurrency! } });
          setIsHydrated(true);
        }

      } catch (error) {
        console.error("Failed to load initial data:", error);
        if (isMounted) {
          // Ensure a userId and default currency are always dispatched even on error
          let errorUserId = finalUserId || (typeof window !== 'undefined' ? localStorage.getItem(USER_ID_KEY) : null) || uuidv4();
          if (typeof window !== 'undefined' && !localStorage.getItem(USER_ID_KEY)) localStorage.setItem(USER_ID_KEY, errorUserId);

          dispatch({ type: 'LOAD_STATE', payload: { userId: errorUserId, currency: defaultCurrency } });
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
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: state.currency.code,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch (error) {
      console.warn("Error formatting currency, falling back to default:", error);
      return `${state.currency.symbol}${amount.toFixed(2)}`;
    }
  }, [state.currency]);

  const contextValue: AppContextProps = {
    state,
    dispatch,
    formatCurrency,
    isLoading: isLoading || !isHydrated,
  };

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
