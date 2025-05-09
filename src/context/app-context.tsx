"use client";
import type React from 'react';
import { createContext, useContext, useReducer, useEffect, useState, useCallback } from 'react';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { getSupportedCurrencies, getUserCurrency, type Currency } from '@/services/currency'; // Import currency services

// --- Types ---
// Keep existing types: Currency, List, Category, ShoppingListItem

// Interface for User (can be expanded if needed)
export interface User {
  id: string; // Unique user ID (could be email or a generated UUID for local auth)
  name: string;
  email?: string; // Optional for now
}

export interface List {
  id: string;
  userId: string; // Associate list with a user
  name: string;
  budgetLimit: number;
  defaultCategory?: string;
}

export interface Category {
  id: string;
  userId: string; // Associate category with a user
  name: string;
}

export interface ShoppingListItem {
  id: string;
  listId: string;
  userId: string; // Associate item with a user
  name: string;
  quantity: number;
  price: number;
  category: string;
  checked: boolean;
  dateAdded: number; // Timestamp
}

interface AppState {
  // userId is now managed by AuthContext
  currency: Currency;
  lists: List[];
  selectedListId: string | null;
  shoppingListItems: ShoppingListItem[];
  categories: Category[];
}

type Action =
  | { type: 'SET_CURRENCY'; payload: Currency }
  | { type: 'ADD_LIST'; payload: { userId: string; name: string; budgetLimit: number; defaultCategory?: string } }
  | { type: 'UPDATE_LIST'; payload: List }
  | { type: 'DELETE_LIST'; payload: { listId: string; userId: string } } // Need userId for filtering
  | { type: 'SELECT_LIST'; payload: string | null }
  | { type: 'ADD_SHOPPING_ITEM'; payload: Omit<ShoppingListItem, 'id' | 'dateAdded'> }
  | { type: 'UPDATE_SHOPPING_ITEM'; payload: ShoppingListItem }
  | { type: 'REMOVE_SHOPPING_ITEM'; payload: string }
  | { type: 'TOGGLE_SHOPPING_ITEM'; payload: string }
  | { type: 'ADD_CATEGORY'; payload: { userId: string; name: string } }
  | { type: 'UPDATE_CATEGORY'; payload: { id: string; userId: string; name: string } }
  | { type: 'REMOVE_CATEGORY'; payload: { categoryId: string; userId: string; reassignToId?: string } }
  | { type: 'LOAD_STATE'; payload: Partial<AppState> } // No userId here, it's from AuthContext
  | { type: 'CLEAR_USER_DATA' }; // Action to clear data on logout

// --- Initial State & Reducer ---
const defaultCurrency: Currency = { code: 'USD', symbol: '$', name: 'US Dollar' };
const DEFAULT_CATEGORIES: Omit<Category, 'userId'>[] = [ // Default categories don't have userId initially
  { id: 'grocery', name: 'Grocery' },
  { id: 'home', name: 'Home' },
  { id: 'health', name: 'Health' },
  { id: 'electronics', name: 'Electronics' },
  { id: 'sports', name: 'Sports' },
  { id: 'uncategorized', name: 'Uncategorized' },
];

// Function to get user-specific storage key
const getUserStorageKey = (userId: string): string => `neonShoppingAppState_user_${userId}`;

const initialState: AppState = {
  currency: defaultCurrency,
  lists: [],
  selectedListId: null,
  shoppingListItems: [],
  categories: [], // Initialize empty, will be loaded or set default for user
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
        userId: action.payload.userId,
        name: action.payload.name,
        budgetLimit: action.payload.budgetLimit,
        defaultCategory: action.payload.defaultCategory || 'uncategorized',
      };
      newState = { ...state, lists: [...state.lists, newList], selectedListId: newList.id };
      break;
    }
    case 'UPDATE_LIST': {
       // Ensure we only update lists belonging to the correct user if needed, though listId should be unique
      newState = {
        ...state,
        lists: state.lists.map(list => list.id === action.payload.id ? action.payload : list),
      };
      break;
    }
    case 'DELETE_LIST': {
      const { listId } = action.payload;
      const remainingLists = state.lists.filter(list => list.id !== listId);
      const newSelectedListId = state.selectedListId === listId
        ? (remainingLists.length > 0 ? remainingLists[0].id : null)
        : state.selectedListId;
      newState = {
        ...state,
        lists: remainingLists,
        shoppingListItems: state.shoppingListItems.filter(item => item.listId !== listId),
        selectedListId: newSelectedListId,
      };
      break;
    }
    case 'SELECT_LIST':
      newState = { ...state, selectedListId: action.payload };
      break;
    case 'ADD_SHOPPING_ITEM': {
      if (!action.payload.listId || !action.payload.userId) {
        console.error("Attempted to add item without listId or userId");
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
        const { userId, name } = action.payload;
        const newCategory: Category = {
            id: uuidv4(),
            userId: userId, // Associate with user
            name: name,
        };
        // Prevent duplicates *for the same user*
        if (state.categories.some(cat => cat.userId === userId && cat.name.toLowerCase() === newCategory.name.toLowerCase())) {
            console.warn("Attempted to add duplicate category name for user:", newCategory.name);
            return state;
        }
        newState = { ...state, categories: [...state.categories, newCategory] };
        break;
    }
    case 'UPDATE_CATEGORY': {
      const { id, userId, name } = action.payload;
       // Prevent renaming to an existing name *for the same user*
      if (state.categories.some(cat => cat.id !== id && cat.userId === userId && cat.name.toLowerCase() === name.toLowerCase())) {
        console.warn("Attempted to rename category to an existing name for user:", name);
        return state;
      }
      newState = {
        ...state,
        categories: state.categories.map(cat =>
          cat.id === id && cat.userId === userId ? { ...cat, name: name } : cat // Ensure userId match
        )
      };
      break;
    }
    case 'REMOVE_CATEGORY': {
      const { categoryId, userId, reassignToId = 'uncategorized' } = action.payload;
      const remainingCategories = state.categories.filter(cat => !(cat.id === categoryId && cat.userId === userId)); // Ensure userId match
      const updatedShoppingListItems = state.shoppingListItems.map(item =>
        item.category === categoryId && item.userId === userId // Ensure userId match
          ? { ...item, category: reassignToId }
          : item
      );
      newState = { ...state, categories: remainingCategories, shoppingListItems: updatedShoppingListItems };
      break;
    }
    case 'LOAD_STATE': {
      // Load state specific to the authenticated user
      // Note: userId is now managed by AuthContext
      const loadedLists = Array.isArray(action.payload.lists) ? action.payload.lists : [];
      const loadedItems = Array.isArray(action.payload.shoppingListItems) ? action.payload.shoppingListItems : [];
      // Categories might need initialization if none are loaded
      const loadedCategories = Array.isArray(action.payload.categories) ? action.payload.categories : [];

      const validSelectedListId = loadedLists.find(l => l.id === action.payload.selectedListId)?.id || (loadedLists.length > 0 ? loadedLists[0].id : null);

      newState = {
        ...initialState, // Start from a clean default slate (except currency maybe)
        currency: action.payload.currency || state.currency, // Keep existing currency or load saved one
        lists: loadedLists,
        selectedListId: validSelectedListId,
        shoppingListItems: loadedItems,
        categories: loadedCategories, // Load saved categories
      };
      // If no categories were loaded for the user, initialize with defaults associated with them
       if (newState.categories.length === 0 && action.payload.userId) { // Check if userId was implicitly passed via auth context logic elsewhere
            const userId = action.payload.userId; // Assuming userId is available when LOAD_STATE is dispatched for logged-in user
            newState.categories = DEFAULT_CATEGORIES.map(cat => ({ ...cat, userId }));
       }

      break;
    }
     case 'CLEAR_USER_DATA':
            // Reset state related to user data, but keep global settings like currency
            newState = {
                ...initialState,
                currency: state.currency, // Keep the current currency
            };
            break;
    default:
      newState = state;
  }

  // Save state to localStorage, keyed by the authenticated user's ID (managed by AuthContext)
  if (action.type !== 'LOAD_STATE' && action.type !== 'CLEAR_USER_DATA' && typeof window !== 'undefined' && action.payload?.userId) {
      const userId = action.payload.userId;
      try {
        const userSpecificStorageKey = getUserStorageKey(userId);
        const stateToSave = { // Only save data relevant to the user's session
          currency: newState.currency,
          lists: newState.lists,
          selectedListId: newState.selectedListId,
          shoppingListItems: newState.shoppingListItems,
          categories: newState.categories,
        };
        localStorage.setItem(userSpecificStorageKey, JSON.stringify(stateToSave));
      } catch (error) {
        console.error("Failed to save state to localStorage for user:", userId, error);
      }
  } else if (action.type === 'CLEAR_USER_DATA' && typeof window !== 'undefined' && action.payload?.userId) {
      // Optionally clear the specific user's data from storage on logout
       const userId = action.payload.userId;
       try {
           localStorage.removeItem(getUserStorageKey(userId));
           console.log("Cleared app state for user:", userId);
       } catch (error) {
           console.error("Failed to clear state from localStorage for user:", userId, error);
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
  loadUserData: (userId: string) => Promise<void>; // Function to load data for a specific user
  clearUserData: (userId: string) => void; // Function to clear data on logout
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [isLoading, setIsLoading] = useState(true); // Loading state for initial load/currency check

  // Load initial currency setting or detect it
  useEffect(() => {
    let isMounted = true;
    const initializeCurrency = async () => {
      setIsLoading(true); // Start loading
      let finalCurrency = defaultCurrency; // Default
      if (typeof window !== 'undefined') {
        try {
          // Try to get currency from a generic storage key first (not user-specific yet)
          const storedCurrencyRaw = localStorage.getItem('neon_shopping_currency');
          if (storedCurrencyRaw) {
            const storedCurrency = JSON.parse(storedCurrencyRaw);
            if (storedCurrency && storedCurrency.code) {
               finalCurrency = storedCurrency;
               console.log("Loaded currency from generic storage:", finalCurrency.code);
            }
          } else {
             // If no generic currency, try auto-detection
             console.log("No generic currency found, attempting auto-detection...");
             const detected = await getUserCurrency();
             if (detected) {
               finalCurrency = detected;
               console.log("Auto-detected currency:", finalCurrency.code);
               localStorage.setItem('neon_shopping_currency', JSON.stringify(finalCurrency)); // Save detected currency
             } else {
                 console.log("Auto-detection failed, using default currency:", finalCurrency.code);
                 localStorage.setItem('neon_shopping_currency', JSON.stringify(finalCurrency)); // Save default
             }
          }
        } catch (error) {
          console.error("Error initializing currency:", error);
          finalCurrency = defaultCurrency; // Fallback to default on error
          localStorage.setItem('neon_shopping_currency', JSON.stringify(finalCurrency)); // Save default on error
        }
      }
      if (isMounted) {
         // Set the currency in the state *before* loading user-specific data
         dispatch({ type: 'SET_CURRENCY', payload: finalCurrency });
         setIsLoading(false); // Finish initial loading phase (currency is set)
      }
    };

    initializeCurrency();
    return () => { isMounted = false; };
  }, []);


  // Function to load data for a specific authenticated user
  const loadUserData = useCallback(async (userId: string) => {
      if (!userId || typeof window === 'undefined') return;
      setIsLoading(true); // Indicate loading user data
      console.log("Loading user data for:", userId);
      try {
          const userSpecificStorageKey = getUserStorageKey(userId);
          const savedStateRaw = localStorage.getItem(userSpecificStorageKey);
          let loadedState: Partial<AppState> = {};
          let categoriesToSet = DEFAULT_CATEGORIES.map(cat => ({ ...cat, userId })); // Default categories for the user

          if (savedStateRaw) {
              try {
                  const parsedState = JSON.parse(savedStateRaw);
                  if (typeof parsedState === 'object' && parsedState !== null) {
                      loadedState = {
                          // Load currency from user state *if available*, otherwise keep the globally set one
                          currency: parsedState.currency || state.currency,
                          lists: parsedState.lists || [],
                          selectedListId: parsedState.selectedListId || null,
                          shoppingListItems: parsedState.shoppingListItems || [],
                          categories: parsedState.categories || categoriesToSet, // Use saved or default
                      };
                      // Ensure loaded categories have the correct userId if they somehow don't
                      loadedState.categories = loadedState.categories?.map(cat => ({ ...cat, userId }));

                       // If loaded categories are empty after parsing, set defaults
                      if (!loadedState.categories || loadedState.categories.length === 0) {
                        loadedState.categories = categoriesToSet;
                      }
                  } else {
                       loadedState.categories = categoriesToSet; // Use defaults if parsing fails
                  }
              } catch (e) {
                  console.error("Failed to parse saved state for user, initializing defaults:", userId, e);
                   loadedState.categories = categoriesToSet; // Use defaults on parse error
              }
          } else {
               console.log("No saved state found for user, initializing defaults:", userId);
                loadedState.categories = categoriesToSet; // Set defaults if no saved state
          }


          // Dispatch LOAD_STATE with the loaded/default data for the user
          // The currency from the initial load will be kept if not overridden by user-specific saved state
          dispatch({ type: 'LOAD_STATE', payload: { ...loadedState, currency: loadedState.currency || state.currency } });

           // Re-validate selectedListId after loading state
           const finalState = appReducer(state, { type: 'LOAD_STATE', payload: { ...loadedState, currency: loadedState.currency || state.currency } });
           const validSelectedListId = finalState.lists.find(l => l.id === finalState.selectedListId)?.id || (finalState.lists.length > 0 ? finalState.lists[0].id : null);
           if (finalState.selectedListId !== validSelectedListId) {
               dispatch({ type: 'SELECT_LIST', payload: validSelectedListId });
           }


      } catch (error) {
          console.error("Failed to load user data:", error);
          // Handle error case, potentially reset to initial state?
      } finally {
          setIsLoading(false);
      }
  }, [state.currency]); // Depend on state.currency to ensure it's set before loading

  // Function to clear user-specific data
   const clearUserData = useCallback((userId: string) => {
       if (!userId) return;
       console.log("Clearing user data for:", userId);
       dispatch({ type: 'CLEAR_USER_DATA', payload: { userId } }); // Pass userId to reducer if needed for storage removal
   }, []);


  const formatCurrency = useCallback((amount: number): string => {
    try {
      return new Intl.NumberFormat(undefined, { // Use browser's default locale
        style: 'currency',
        currency: state.currency.code,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch (error) {
      console.warn("Error formatting currency, falling back to default:", error);
      // Fallback to simple formatting
      return `${state.currency.symbol || state.currency.code}${amount.toFixed(2)}`;
    }
  }, [state.currency]);

  const contextValue: AppContextProps = {
    state,
    dispatch,
    formatCurrency,
    isLoading,
    loadUserData,
    clearUserData,
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
