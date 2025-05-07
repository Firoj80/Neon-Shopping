
"use client";
import type React from 'react';
import { createContext, useContext, useReducer, useEffect, useState, useCallback }
  from 'react';
import { format, startOfDay, isSameDay } from 'date-fns';
import { themes, defaultThemeId } from '@/config/themes'; // Ensure themes and defaultThemeId are imported
import { v4 as uuidv4 } from 'uuid'; // Import UUID generator

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
  // Add other list-specific properties if needed, e.g., creationDate
}

export interface BudgetItem { // This will represent the budget of the *selected* list
  listId: string | null; // ID of the list this budget belongs to
  limit: number;
  spent: number;
  lastSetDate: string | null; // YYYY-MM-DD for when the limit was set for this list
}

export interface Category {
  id: string;
  name: string;
}

export interface ShoppingListItem { // Renamed from Item to avoid conflict with native Item
  id: string;
  listId: string; // Foreign key to associate with a List
  name: string;
  quantity: number;
  price: number;
  category: string;
  checked: boolean; // "purchased" flag
  dateAdded: number; // Timestamp
}

interface AppState {
  userId: string;
  currency: Currency;
  lists: List[];
  selectedListId: string | null;
  shoppingListItems: ShoppingListItem[]; // Stores all items for all lists
  categories: Category[];
  isPremium: boolean;
  theme: string; // Added theme property
}

type Action =
  | { type: 'SET_CURRENCY'; payload: Currency }
  | { type: 'ADD_LIST'; payload: { name: string; budgetLimit: number } }
  | { type: 'UPDATE_LIST'; payload: List } // For name and budgetLimit
  | { type: 'DELETE_LIST'; payload: string } // listId
  | { type: 'SELECT_LIST'; payload: string | null } // listId or null if no list selected
  | { type: 'ADD_SHOPPING_ITEM'; payload: Omit<ShoppingListItem, 'id' | 'dateAdded'> }
  | { type: 'UPDATE_SHOPPING_ITEM'; payload: ShoppingListItem }
  | { type: 'REMOVE_SHOPPING_ITEM'; payload: string } // itemId
  | { type: 'TOGGLE_SHOPPING_ITEM'; payload: string } // itemId
  | { type: 'ADD_CATEGORY'; payload: { name: string } }
  | { type: 'UPDATE_CATEGORY'; payload: { id: string; name: string } }
  | { type: 'REMOVE_CATEGORY'; payload: { categoryId: string; reassignToId?: string } }
  | { type: 'SET_PREMIUM'; payload: boolean }
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

const initialListId = uuidv4();
const INITIAL_LISTS: List[] = [
  { id: initialListId, name: 'My First List', budgetLimit: 100 },
];

const initialState: AppState = {
  userId: '', // Will be set on load
  currency: defaultCurrency,
  lists: INITIAL_LISTS,
  selectedListId: initialListId,
  shoppingListItems: [],
  categories: DEFAULT_CATEGORIES,
  isPremium: false,
  theme: defaultThemeId, // Initialize with default theme
};

const LOCAL_STORAGE_KEY_PREFIX = 'neonShoppingAppState_v9_'; // Updated version for potential schema changes
const USER_ID_KEY = 'neonShoppingUserId_v1';


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
         updatedShoppingListItems = state.shoppingListItems.map(item =>
            item.category === categoryId ? { ...item, category: 'uncategorized' } : item
          );
      }
      newState = { ...state, categories: remainingCategories, shoppingListItems: updatedShoppingListItems };
      break;
    }
    case 'SET_PREMIUM': {
      newState = { ...state, isPremium: action.payload };
      break;
    }
    case 'SET_THEME': { // Handle SET_THEME action
      newState = { ...state, theme: action.payload };
      break;
    }
    case 'LOAD_STATE': {
      const loadedUserId = action.payload.userId;
      newState = {
        ...initialState,
        ...action.payload,
        userId: loadedUserId,
        lists: action.payload.lists && action.payload.lists.length > 0 ? action.payload.lists : INITIAL_LISTS,
        selectedListId: action.payload.selectedListId || (action.payload.lists && action.payload.lists.length > 0 ? action.payload.lists[0].id : initialListId),
        categories: action.payload.categories && action.payload.categories.length > 0 ? action.payload.categories : DEFAULT_CATEGORIES,
        currency: action.payload.currency || defaultCurrency,
        isPremium: action.payload.isPremium ?? false,
        theme: action.payload.theme || defaultThemeId, // Load theme or use default
      };
      break;
    }
    default:
      newState = state;
  }

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
                  isPremium: parsedState.isPremium,
                  theme: parsedState.theme, // Load theme
                };
              }
            } catch (e) {
              console.error("Failed to parse saved state, resetting:", e);
              localStorage.removeItem(userSpecificStorageKey);
            }
          }
        }

        if (isMounted) {
          dispatch({ type: 'LOAD_STATE', payload: { ...loadedStateFromStorage, userId: userIdFromStorage || uuidv4() } });
          setIsHydrated(true);
        }

      } catch (error) {
        console.error("Failed to load initial data:", error);
        if (isMounted) {
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
  }, []);


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
interface AppContextProps {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  formatCurrency: (amount: number) => string;
  isLoading: boolean;
}

export const useAppContext = (): AppContextProps => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
