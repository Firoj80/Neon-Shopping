
"use client";
import type React from 'react';
import { createContext, useContext, useReducer, useEffect, useState, useCallback } from 'react';
import { format, startOfDay, isSameDay } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { themes, defaultThemeId } from '@/config/themes'; // Import themes and defaultThemeId

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
  defaultCategory?: string; // Optional: Default category for items in this list
}

export interface BudgetItem {
  limit: number;
  spent: number; // Money spent *today*
  lastSetDate: string | null; // YYYY-MM-DD
}

export interface Category {
  id: string;
  name: string;
}

export interface ShoppingListItem {
  id: string;
  listId: string; // ID of the list this item belongs to
  name: string;
  quantity: number;
  price: number;
  category: string;
  checked: boolean;
  dateAdded: number; // Timestamp
}

interface AppState {
  userId: string; // For localStorage keying
  currency: Currency;
  lists: List[];
  selectedListId: string | null;
  shoppingListItems: ShoppingListItem[];
  categories: Category[];
  theme: string; // Added theme state
}

type Action =
  | { type: 'SET_CURRENCY'; payload: Currency }
  | { type: 'ADD_LIST'; payload: { name: string; budgetLimit: number; defaultCategory?: string } }
  | { type: 'UPDATE_LIST'; payload: List }
  | { type: 'DELETE_LIST'; payload: string } // Payload is listId
  | { type: 'SELECT_LIST'; payload: string | null }
  | { type: 'ADD_SHOPPING_ITEM'; payload: Omit<ShoppingListItem, 'id' | 'dateAdded'> }
  | { type: 'UPDATE_SHOPPING_ITEM'; payload: ShoppingListItem }
  | { type: 'REMOVE_SHOPPING_ITEM'; payload: string } // Payload is itemId
  | { type: 'TOGGLE_SHOPPING_ITEM'; payload: string } // Payload is itemId
  | { type: 'ADD_CATEGORY'; payload: { name: string } }
  | { type: 'UPDATE_CATEGORY'; payload: { id: string; name: string } }
  | { type: 'REMOVE_CATEGORY'; payload: { categoryId: string; reassignToId?: string } }
  | { type: 'SET_THEME'; payload: string } // Added SET_THEME action
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


const USER_ID_KEY = 'neonShoppingUserId_v2';
const LOCAL_STORAGE_KEY_PREFIX = 'neonShoppingAppState_v2_';


const initialState: AppState = {
  userId: '', // Will be set to UUID on load
  currency: defaultCurrency,
  lists: INITIAL_LISTS,
  selectedListId: null,
  shoppingListItems: [],
  categories: DEFAULT_CATEGORIES,
  theme: defaultThemeId, // Initialize with default theme
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
        defaultCategory: action.payload.defaultCategory,
      };
      // Automatically select the newly added list
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
          item.id === action.payload ? { ...item, checked: !item.checked, dateAdded: !item.checked ? Date.now() : item.dateAdded } : item
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
         // Fallback to a generic 'uncategorized'
         updatedShoppingListItems = state.shoppingListItems.map(item =>
            item.category === categoryId ? { ...item, category: 'uncategorized' } : item // Assuming 'uncategorized' is a valid ID or handled
          );
      }
      newState = { ...state, categories: remainingCategories, shoppingListItems: updatedShoppingListItems };
      break;
    }
    case 'SET_THEME': // Handle theme change
      newState = { ...state, theme: action.payload };
      break;
    case 'LOAD_STATE': {
      const loadedUserId = action.payload.userId || uuidv4(); // Ensure userId is always present
      const loadedLists = action.payload.lists && action.payload.lists.length > 0 ? action.payload.lists : INITIAL_LISTS;
      newState = {
        ...initialState, // Start from a clean slate to ensure all defaults are set
        ...action.payload, // Apply loaded data
        userId: loadedUserId,
        lists: loadedLists,
        // Ensure selectedListId is valid or null
        selectedListId: action.payload.selectedListId || (loadedLists.length > 0 ? loadedLists[0].id : null),
        categories: action.payload.categories && action.payload.categories.length > 0 ? action.payload.categories : DEFAULT_CATEGORIES,
        currency: action.payload.currency || defaultCurrency,
        theme: action.payload.theme || defaultThemeId, // Load theme or default
      };
      break;
    }
    default:
      newState = state;
  }

  // Save to localStorage after every action except initial load or if no userId
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
                loadedStateFromStorage = {
                  currency: parsedState.currency,
                  lists: parsedState.lists,
                  selectedListId: parsedState.selectedListId,
                  shoppingListItems: parsedState.shoppingListItems,
                  categories: parsedState.categories,
                  theme: parsedState.theme, // Load theme
                };
              }
            } catch (e) {
              console.error("Failed to parse saved state, resetting for user:", userIdFromStorage, e);
              localStorage.removeItem(userSpecificStorageKey); // Clear corrupted state
            }
          }
        } else {
          userIdFromStorage = uuidv4(); // Fallback for non-browser, though less relevant for pure client-side
        }

        if (isMounted) {
          dispatch({ type: 'LOAD_STATE', payload: { ...loadedStateFromStorage, userId: userIdFromStorage } });
          setIsHydrated(true);
        }

      } catch (error) {
        console.error("Failed to load initial data:", error);
        if (isMounted) {
          let finalUserId = userIdFromStorage || (typeof window !== 'undefined' ? localStorage.getItem(USER_ID_KEY) : null) || uuidv4();
          if (typeof window !== 'undefined' && !localStorage.getItem(USER_ID_KEY)) localStorage.setItem(USER_ID_KEY, finalUserId);

          dispatch({ type: 'LOAD_STATE', payload: { userId: finalUserId } }); // Ensure userId is always dispatched
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
