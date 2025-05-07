
"use client";
import type React from 'react';
import { createContext, useContext, useReducer, useEffect, useState, useCallback }
  from 'react';
import { format, startOfDay, isSameDay } from 'date-fns';
import { themes, defaultThemeId } from '@/config/themes'; // Import themes and default theme ID
import { v4 as uuidv4 } from 'uuid';

// --- Types ---
export interface Currency {
  code: string;
  symbol: string;
  name: string;
}

export interface BudgetItem {
  limit: number;
  spent: number;
  lastSetDate: string | null;
}

export interface Category {
  id: string;
  name: string;
}

export interface ShoppingListItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  category: string;
  checked: boolean;
  dateAdded: number;
}

interface AppState {
  userId: string;
  currency: Currency;
  budget: BudgetItem;
  shoppingList: ShoppingListItem[];
  categories: Category[];
  theme: string; // ID of the selected theme
  isPremium: boolean;
}

type Action =
  | { type: 'SET_CURRENCY'; payload: Currency }
  | { type: 'SET_BUDGET_LIMIT'; payload: { limit: number; date: string } }
  | { type: 'RESET_DAILY_BUDGET'; payload: { today: string } }
  | { type: 'ADD_SHOPPING_ITEM'; payload: Omit<ShoppingListItem, 'id' | 'dateAdded'> }
  | { type: 'UPDATE_SHOPPING_ITEM'; payload: ShoppingListItem }
  | { type: 'REMOVE_SHOPPING_ITEM'; payload: string }
  | { type: 'TOGGLE_SHOPPING_ITEM'; payload: string }
  | { type: 'ADD_CATEGORY'; payload: { name: string } }
  | { type: 'UPDATE_CATEGORY'; payload: { id: string; name: string } }
  | { type: 'REMOVE_CATEGORY'; payload: { categoryId: string; reassignToId?: string } }
  | { type: 'SET_THEME'; payload: string } // Action to set the theme
  | { type: 'LOAD_STATE'; payload: Partial<AppState> }
  | { type: 'SET_PREMIUM'; payload: boolean };

interface AppContextProps {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  formatCurrency: (amount: number) => string;
  isLoading: boolean;
}

// --- Initial State & Reducer ---
const defaultCurrency: Currency = { code: 'USD', symbol: '$', name: 'US Dollar' };
const DEFAULT_CATEGORIES: Category[] = [
  { id: 'grocery', name: 'Grocery' },
  { id: 'home', name: 'Home' },
  { id: 'health', name: 'Health' },
  { id: 'electronics', name: 'Electronics' },
  { id: 'sports', name: 'Sports' },
];

const initialState: AppState = {
  userId: '',
  currency: defaultCurrency,
  budget: { limit: 0, spent: 0, lastSetDate: null },
  shoppingList: [],
  categories: DEFAULT_CATEGORIES,
  theme: defaultThemeId, // Initialize with default theme ID
  isPremium: false,
};

const LOCAL_STORAGE_KEY_PREFIX = 'neonShoppingAppState_v7_'; // Prefix for user-specific data
const USER_ID_KEY = 'neonShoppingUserId_v1';

const calculateTodaysSpent = (list: ShoppingListItem[], todayDate: Date): number => {
  const startOfTodayTimestamp = startOfDay(todayDate).getTime();
  return list
    .filter(item => item.checked && item.dateAdded >= startOfTodayTimestamp)
    .reduce((total, item) => total + (item.price * item.quantity), 0);
};

function appReducer(state: AppState, action: Action): AppState {
  let newState: AppState;
  const todayDate = new Date();

  switch (action.type) {
    case 'SET_CURRENCY':
      newState = { ...state, currency: action.payload };
      break;
    case 'SET_BUDGET_LIMIT': {
      newState = {
        ...state,
        budget: {
          ...state.budget,
          limit: action.payload.limit,
          lastSetDate: action.payload.date,
          spent: calculateTodaysSpent(state.shoppingList, todayDate),
        }
      };
      break;
    }
    case 'RESET_DAILY_BUDGET': {
      newState = {
        ...state,
        budget: {
          ...state.budget,
          spent: calculateTodaysSpent(state.shoppingList, todayDate),
          lastSetDate: action.payload.today,
        }
      };
      break;
    }
    case 'ADD_SHOPPING_ITEM': {
      const newItem: ShoppingListItem = {
        ...action.payload,
        id: uuidv4(),
        dateAdded: Date.now(),
      };
      newState = { ...state, shoppingList: [newItem, ...state.shoppingList] };
      break;
    }
    case 'UPDATE_SHOPPING_ITEM': {
      const updatedList = state.shoppingList.map((item) =>
        item.id === action.payload.id ? action.payload : item
      );
      newState = {
        ...state,
        shoppingList: updatedList,
        budget: { ...state.budget, spent: calculateTodaysSpent(updatedList, todayDate) }
      };
      break;
    }
    case 'REMOVE_SHOPPING_ITEM': {
      const filteredList = state.shoppingList.filter((item) => item.id !== action.payload);
      newState = {
        ...state,
        shoppingList: filteredList,
        budget: { ...state.budget, spent: calculateTodaysSpent(filteredList, todayDate) }
      };
      break;
    }
    case 'TOGGLE_SHOPPING_ITEM': {
      const toggledList = state.shoppingList.map((item) =>
        item.id === action.payload ? { ...item, checked: !item.checked } : item
      );
      newState = {
        ...state,
        shoppingList: toggledList,
        budget: { ...state.budget, spent: calculateTodaysSpent(toggledList, todayDate) }
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
      const updatedCategories = state.categories.map(cat =>
        cat.id === action.payload.id ? { ...cat, name: action.payload.name } : cat
      );
      newState = { ...state, categories: updatedCategories };
      break;
    }
    case 'REMOVE_CATEGORY': {
      const { categoryId, reassignToId } = action.payload;
      const remainingCategories = state.categories.filter(cat => cat.id !== categoryId);
      let updatedShoppingList = state.shoppingList;
      if (reassignToId) {
        updatedShoppingList = state.shoppingList.map(item =>
          item.category === categoryId ? { ...item, category: reassignToId } : item
        );
      } else {
        updatedShoppingList = state.shoppingList.filter(item => item.category !== categoryId);
      }
      newState = { ...state, categories: remainingCategories, shoppingList: updatedShoppingList };
      newState.budget.spent = calculateTodaysSpent(newState.shoppingList, todayDate);
      break;
    }
    case 'SET_THEME': {
      newState = { ...state, theme: action.payload };
      break;
    }
    case 'SET_PREMIUM': {
      newState = { ...state, isPremium: action.payload };
      break;
    }
    case 'LOAD_STATE': {
      const loadedUserId = action.payload.userId || state.userId || uuidv4();
      const loadedList = action.payload.shoppingList || initialState.shoppingList;
      const loadedBudget = action.payload.budget || initialState.budget;
      const loadedCurrency = action.payload.currency || initialState.currency;
      const loadedCategories = action.payload.categories && action.payload.categories.length > 0
        ? action.payload.categories
        : DEFAULT_CATEGORIES;
      const loadedTheme = action.payload.theme || defaultThemeId; // Load theme or default
      const loadedIsPremium = action.payload.isPremium ?? initialState.isPremium;

      const initialSpent = calculateTodaysSpent(loadedList, todayDate);

      newState = {
        userId: loadedUserId,
        currency: loadedCurrency,
        budget: {
          limit: loadedBudget.limit,
          spent: initialSpent,
          lastSetDate: loadedBudget.lastSetDate,
        },
        shoppingList: loadedList,
        categories: loadedCategories,
        theme: loadedTheme,
        isPremium: loadedIsPremium,
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
const AppContext = createContext<AppContextProps | undefined>(undefined);

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
                budget: parsedState.budget,
                shoppingList: Array.isArray(parsedState.shoppingList) ? parsedState.shoppingList : undefined,
                categories: Array.isArray(parsedState.categories) ? parsedState.categories : undefined,
                theme: parsedState.theme, // Load theme
                isPremium: parsedState.isPremium,
              };
            }
          } catch (e) {
            console.error("Failed to parse saved state, resetting:", e);
            localStorage.removeItem(userSpecificStorageKey);
          }
        }

        if (!loadedStateFromStorage.categories || loadedStateFromStorage.categories.length === 0) {
          loadedStateFromStorage.categories = DEFAULT_CATEGORIES;
        }
        if (!loadedStateFromStorage.currency) {
          loadedStateFromStorage.currency = defaultCurrency;
        }
        if (!loadedStateFromStorage.theme) { // Ensure theme defaults
          loadedStateFromStorage.theme = defaultThemeId;
        }
        if (loadedStateFromStorage.isPremium === undefined) {
          loadedStateFromStorage.isPremium = false;
        }

        if (isMounted) {
          dispatch({ type: 'LOAD_STATE', payload: { ...loadedStateFromStorage, userId: userIdFromStorage } });
          setIsHydrated(true);
        }

      } catch (error) {
        console.error("Failed to load initial data:", error);
        if (isMounted) {
          let finalUserId = userIdFromStorage || localStorage.getItem(USER_ID_KEY) || uuidv4();
          if (!localStorage.getItem(USER_ID_KEY)) localStorage.setItem(USER_ID_KEY, finalUserId);
          dispatch({ type: 'LOAD_STATE', payload: { userId: finalUserId, theme: defaultThemeId } });
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

  useEffect(() => {
    if (!isLoading && isHydrated) {
      const today = new Date();
      const todayString = format(today, 'yyyy-MM-dd');
      const lastSetDate = state.budget.lastSetDate ? new Date(state.budget.lastSetDate + 'T00:00:00') : null;
      if (lastSetDate && !isSameDay(today, lastSetDate)) {
        dispatch({ type: 'RESET_DAILY_BUDGET', payload: { today: todayString } });
      } else if (!lastSetDate) {
        dispatch({ type: 'RESET_DAILY_BUDGET', payload: { today: todayString } });
      }
    }
  }, [isLoading, isHydrated, state.budget.lastSetDate]);

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

  const contextValue = {
    state,
    dispatch,
    formatCurrency,
    isLoading: isLoading || !isHydrated,
  };

  // Export AppContext for ThemeWatcher
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

// Export AppContext for direct consumption by ThemeWatcher if needed, though useAppContext is preferred
export { AppContext };
