
"use client";
import type React from 'react';
import { createContext, useContext, useReducer, useEffect, useState, useCallback } from 'react';
import { format, startOfDay, isSameDay } from 'date-fns';

// --- Types ---
export interface Currency {
  code: string;
  symbol: string;
  name: string;
}

export interface BudgetItem {
  limit: number;
  spent: number; // Represents money actually spent (checked items) *today*
  lastSetDate: string | null; // YYYY-MM-DD format for when the limit was last set
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
  category: string; // Now refers to the category ID
  checked: boolean; // Indicates if the item has been purchased
  dateAdded: number; // Timestamp
}

interface AppState {
  currency: Currency;
  budget: BudgetItem;
  shoppingList: ShoppingListItem[];
  categories: Category[]; // Add categories to state
}

type Action =
  | { type: 'SET_CURRENCY'; payload: Currency }
  | { type: 'SET_BUDGET_LIMIT'; payload: { limit: number; date: string } }
  | { type: 'RESET_DAILY_BUDGET'; payload: { today: string } }
  | { type: 'ADD_SHOPPING_ITEM'; payload: Omit<ShoppingListItem, 'id' | 'dateAdded'> }
  | { type: 'UPDATE_SHOPPING_ITEM'; payload: ShoppingListItem }
  | { type: 'REMOVE_SHOPPING_ITEM'; payload: string } // id
  | { type: 'TOGGLE_SHOPPING_ITEM'; payload: string } // id
  | { type: 'ADD_CATEGORY'; payload: { name: string } } // Add category action
  | { type: 'UPDATE_CATEGORY'; payload: { id: string; name: string } } // Update category action
  | { type: 'REMOVE_CATEGORY'; payload: { categoryId: string; reassignToId?: string } } // Remove category action
  | { type: 'LOAD_STATE'; payload: Partial<AppState> };

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
  currency: defaultCurrency,
  budget: { limit: 0, spent: 0, lastSetDate: null },
  shoppingList: [],
  categories: DEFAULT_CATEGORIES, // Initialize with default categories
};

const LOCAL_STORAGE_KEY = 'neonShoppingListState_v3'; // Increment version for schema change

// Helper to calculate spent amount based on checked items added *today*
const calculateTodaysSpent = (list: ShoppingListItem[], todayDate: Date): number => {
  const startOfTodayTimestamp = startOfDay(todayDate).getTime();
  return list
    .filter(item => item.checked && item.dateAdded >= startOfTodayTimestamp)
    .reduce((total, item) => total + (item.price * item.quantity), 0);
};

function appReducer(state: AppState, action: Action): AppState {
  let newState: AppState;
  const todayDate = new Date(); // Calculate today's date once

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
          limit: 0,
          spent: calculateTodaysSpent(state.shoppingList, todayDate),
          lastSetDate: action.payload.today,
        }
      };
      break;
    }
    case 'ADD_SHOPPING_ITEM': {
      const newItem: ShoppingListItem = {
        ...action.payload,
        id: crypto.randomUUID(),
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
            id: crypto.randomUUID(),
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

        // If items need reassignment, update them
        let updatedShoppingList = state.shoppingList;
        if (reassignToId) {
            updatedShoppingList = state.shoppingList.map(item =>
                item.category === categoryId ? { ...item, category: reassignToId } : item
            );
        } else {
             // If no reassignment ID provided (maybe category had no items), filter out items associated with deleted category? Or set to 'uncategorized'? Let's remove them for now if not reassigned. Could add an 'uncategorized' logic later.
             updatedShoppingList = state.shoppingList.filter(item => item.category !== categoryId);
        }

        newState = { ...state, categories: remainingCategories, shoppingList: updatedShoppingList };
        // Recalculate budget spent as list might have changed
        newState.budget.spent = calculateTodaysSpent(newState.shoppingList, todayDate);
        break;
    }
    case 'LOAD_STATE': {
      const loadedList = action.payload.shoppingList || initialState.shoppingList;
      const loadedBudget = action.payload.budget || initialState.budget;
      const loadedCurrency = action.payload.currency || initialState.currency;
      // Load categories, falling back to default if none are saved
      const loadedCategories = action.payload.categories && action.payload.categories.length > 0
                                  ? action.payload.categories
                                  : DEFAULT_CATEGORIES;

      const initialSpent = calculateTodaysSpent(loadedList, todayDate);

      newState = {
        currency: loadedCurrency,
        budget: {
          limit: loadedBudget.limit,
          spent: initialSpent,
          lastSetDate: loadedBudget.lastSetDate,
        },
        shoppingList: loadedList,
        categories: loadedCategories, // Load categories
      };
      break;
    }
    default:
      newState = state;
  }

  // Persist state changes AFTER calculating new state
  if (action.type !== 'LOAD_STATE' && typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newState));
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

  // Effect 1: Load initial state from localStorage and fetch currency
  useEffect(() => {
    let isMounted = true;
    const loadInitialData = async () => {
      setIsLoading(true);
      let loadedStateFromStorage: Partial<AppState> = {};
      try {
        const savedStateRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedStateRaw) {
          try {
            const parsedState = JSON.parse(savedStateRaw);
            if (typeof parsedState === 'object' && parsedState !== null) {
              loadedStateFromStorage = {
                currency: parsedState.currency,
                budget: parsedState.budget,
                shoppingList: Array.isArray(parsedState.shoppingList) ? parsedState.shoppingList : undefined,
                 categories: Array.isArray(parsedState.categories) ? parsedState.categories : undefined, // Load categories
              };
            }
          } catch (e) {
            console.error("Failed to parse saved state:", e);
            localStorage.removeItem(LOCAL_STORAGE_KEY);
          }
        }

        // Auto-detect currency logic is now in the Settings page
        // const userCurrency = await getUserCurrency();

        if (isMounted) {
          // Ensure categories have default if none loaded
          if (!loadedStateFromStorage.categories || loadedStateFromStorage.categories.length === 0) {
             loadedStateFromStorage.categories = DEFAULT_CATEGORIES;
          }

          const finalInitialState = {
            ...loadedStateFromStorage,
            // currency: userCurrency ?? loadedStateFromStorage.currency ?? defaultCurrency,
            currency: loadedStateFromStorage.currency ?? defaultCurrency, // Use saved or default, detection happens in settings
          };
          dispatch({ type: 'LOAD_STATE', payload: finalInitialState });
          setIsHydrated(true);
        }

      } catch (error) {
        console.error("Failed to load initial data:", error);
        if (isMounted) {
           // Ensure categories have default if none loaded even on error
           if (!loadedStateFromStorage.categories || loadedStateFromStorage.categories.length === 0) {
             loadedStateFromStorage.categories = DEFAULT_CATEGORIES;
           }
           dispatch({ type: 'LOAD_STATE', payload: loadedStateFromStorage });
           setIsHydrated(true);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Effect 2: Check for daily budget reset
  useEffect(() => {
    if (!isLoading && isHydrated) {
      const today = new Date();
      const todayString = format(today, 'yyyy-MM-dd');
      const lastSetDate = state.budget.lastSetDate ? new Date(state.budget.lastSetDate + 'T00:00:00') : null;

      if (!lastSetDate || !isSameDay(today, lastSetDate)) {
        dispatch({ type: 'RESET_DAILY_BUDGET', payload: { today: todayString } });
      }
      // Recalculation of spent amount is handled within relevant actions now
    }
  }, [isLoading, isHydrated, state.budget.lastSetDate]); // Only depends on these

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

    