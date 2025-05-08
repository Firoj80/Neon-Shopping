"use client";
import type React from 'react';
import { createContext, useContext, useReducer, useEffect, useState, useCallback } from 'react';
import { format } from 'date-fns'; // Removed startOfDay, isSameDay as budget is simpler now
import { v4 as uuidv4 } from 'uuid';
// Removed theme imports as themes are managed separately or removed
// import { themes, defaultTheme } from '@/config/themes';

// --- Types ---
export interface Currency {
  code: string;
  symbol: string;
  name: string;
}

// Simplified List type
export interface List {
  id: string;
  name: string;
  budgetLimit: number; // Budget limit per list
  defaultCategory?: string; // Optional: Default category for items in this list
}

// Removed BudgetItem as budget is now part of the List

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
  category: string; // Category ID or 'uncategorized'
  checked: boolean;
  dateAdded: number; // Timestamp when added OR when marked as purchased
}

interface AppState {
  userId: string; // For localStorage keying (anonymous user)
  currency: Currency;
  lists: List[];
  selectedListId: string | null;
  shoppingListItems: ShoppingListItem[]; // Combined list of items
  categories: Category[];
  // Removed theme state: theme: string;
}

type Action =
  | { type: 'SET_CURRENCY'; payload: Currency }
  | { type: 'ADD_LIST'; payload: { name: string; budgetLimit: number; defaultCategory?: string } }
  | { type: 'UPDATE_LIST'; payload: List }
  | { type: 'DELETE_LIST'; payload: string } // Payload is listId
  | { type: 'SELECT_LIST'; payload: string | null }
  | { type: 'ADD_SHOPPING_ITEM'; payload: Omit<ShoppingListItem, 'id' | 'dateAdded'> } // `checked` is also omitted initially
  | { type: 'UPDATE_SHOPPING_ITEM'; payload: ShoppingListItem }
  | { type: 'REMOVE_SHOPPING_ITEM'; payload: string } // Payload is itemId
  | { type: 'TOGGLE_SHOPPING_ITEM'; payload: string } // Payload is itemId
  | { type: 'ADD_CATEGORY'; payload: { name: string } }
  | { type: 'UPDATE_CATEGORY'; payload: { id: string; name: string } }
  | { type: 'REMOVE_CATEGORY'; payload: { categoryId: string; reassignToId?: string } }
  // Removed SET_THEME action
  | { type: 'LOAD_STATE'; payload: Partial<AppState> & { userId: string } };

// --- Initial State & Reducer ---
const defaultCurrency: Currency = { code: 'USD', symbol: '$', name: 'US Dollar' };
const DEFAULT_CATEGORIES: Category[] = [
  { id: 'grocery', name: 'Grocery' },
  { id: 'home', name: 'Home' },
  { id: 'health', name: 'Health' },
  { id: 'electronics', name: 'Electronics' },
  { id: 'sports', name: 'Sports' },
  { id: 'uncategorized', name: 'Uncategorized' }, // Added uncategorized explicitly
];

// Start with no initial lists
const INITIAL_LISTS: List[] = [];

const USER_ID_KEY = 'neonShoppingUserId_v2'; // Keep versioning for storage keys
const LOCAL_STORAGE_KEY_PREFIX = 'neonShoppingAppState_v2_';

const initialState: AppState = {
  userId: '', // Will be set to UUID on load
  currency: defaultCurrency,
  lists: INITIAL_LISTS,
  selectedListId: null, // No list selected initially
  shoppingListItems: [],
  categories: DEFAULT_CATEGORIES,
  // Removed theme state: theme: defaultTheme.id,
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
        defaultCategory: action.payload.defaultCategory || 'uncategorized', // Default to uncategorized if not provided
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
        ? (remainingLists.length > 0 ? remainingLists[0].id : null) // Select first remaining or null
        : state.selectedListId;
      newState = {
        ...state,
        lists: remainingLists,
        shoppingListItems: state.shoppingListItems.filter(item => item.listId !== listIdToDelete), // Remove items of the deleted list
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
        return state; // Keep current state if listId is missing
      }
      const newItem: ShoppingListItem = {
        ...action.payload,
        id: uuidv4(),
        dateAdded: Date.now(),
        checked: false, // Ensure new items start unchecked
      };
      newState = { ...state, shoppingListItems: [newItem, ...state.shoppingListItems] }; // Add to beginning
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
            ? { ...item, checked: !item.checked, dateAdded: !item.checked ? Date.now() : item.dateAdded } // Update timestamp when checked
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
      // Prevent adding duplicate category names (case-insensitive)
      if (state.categories.some(cat => cat.name.toLowerCase() === newCategory.name.toLowerCase())) {
         console.warn("Attempted to add duplicate category name:", newCategory.name);
         return state;
      }
      newState = { ...state, categories: [...state.categories, newCategory] };
      break;
    }
    case 'UPDATE_CATEGORY': {
       // Prevent renaming to an existing category name (case-insensitive)
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
      const { categoryId, reassignToId = 'uncategorized' } = action.payload; // Default reassignment to 'uncategorized'
      const remainingCategories = state.categories.filter(cat => cat.id !== categoryId);
      const updatedShoppingListItems = state.shoppingListItems.map(item =>
        item.category === categoryId ? { ...item, category: reassignToId } : item
      );
      newState = { ...state, categories: remainingCategories, shoppingListItems: updatedShoppingListItems };
      break;
    }
    // Removed SET_THEME case
    case 'LOAD_STATE': {
        const loadedUserId = action.payload.userId || uuidv4(); // Ensure userId exists
        // Ensure lists, items, categories are arrays, provide defaults if missing or invalid
        const loadedLists = Array.isArray(action.payload.lists) ? action.payload.lists : INITIAL_LISTS;
        const loadedItems = Array.isArray(action.payload.shoppingListItems) ? action.payload.shoppingListItems : [];
        const loadedCategories = Array.isArray(action.payload.categories) && action.payload.categories.length > 0
                                 ? action.payload.categories
                                 : DEFAULT_CATEGORIES;
        // Select the first list if available and no list was previously selected or the selection is invalid
        const validSelectedListId = loadedLists.find(l => l.id === action.payload.selectedListId)?.id || (loadedLists.length > 0 ? loadedLists[0].id : null);

        newState = {
            ...initialState, // Start from a clean default slate
            userId: loadedUserId,
            currency: action.payload.currency || defaultCurrency,
            lists: loadedLists,
            selectedListId: validSelectedListId,
            shoppingListItems: loadedItems,
            categories: loadedCategories,
            // theme state removed
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
      // Only save the necessary parts of the state
      const stateToSave = {
          currency: newState.currency,
          lists: newState.lists,
          selectedListId: newState.selectedListId,
          shoppingListItems: newState.shoppingListItems,
          categories: newState.categories,
          // theme state removed
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
                 // Explicitly load only the expected keys
                 loadedStateFromStorage = {
                     currency: parsedState.currency,
                     lists: parsedState.lists,
                     selectedListId: parsedState.selectedListId,
                     shoppingListItems: parsedState.shoppingListItems,
                     categories: parsedState.categories,
                     // theme state removed
                 };
              }
            } catch (e) {
              console.error("Failed to parse saved state, resetting for user:", userIdFromStorage, e);
              localStorage.removeItem(userSpecificStorageKey); // Clear corrupted state
            }
          }
        } else {
          // Fallback for non-browser environments (less likely needed for pure client-side)
          userIdFromStorage = uuidv4();
        }

        if (isMounted) {
          // Dispatch with the ensured userId
          dispatch({ type: 'LOAD_STATE', payload: { ...loadedStateFromStorage, userId: userIdFromStorage! } });
          setIsHydrated(true);
        }

      } catch (error) {
        console.error("Failed to load initial data:", error);
        if (isMounted) {
           // Ensure a userId is always dispatched even on error
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
      return new Intl.NumberFormat(undefined, { // Use browser default locale
        style: 'currency',
        currency: state.currency.code,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch (error) {
      console.warn("Error formatting currency, falling back to default:", error);
      // Fallback format
      return `${state.currency.symbol}${amount.toFixed(2)}`;
    }
  }, [state.currency]);

  const contextValue: AppContextProps = {
    state,
    dispatch,
    formatCurrency,
    isLoading: isLoading || !isHydrated, // Loading until initial load and hydration are complete
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
