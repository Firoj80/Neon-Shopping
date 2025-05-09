// src/context/app-context.tsx
"use client";

import React, { createContext, useContext, useReducer, useEffect, useState, useCallback, type ReactNode } from 'react';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { getUserCurrency, type Currency } from '@/services/currency';
import { fetchFromApi } from '@/lib/api';

const LOCAL_STORAGE_KEY_PREFIX = 'neonShoppingState_v3_user_';
const ANONYMOUS_USER_ID_KEY = 'anonymous_user_id_neon_shopping';


export const FREEMIUM_LIST_LIMIT = 3;
export const FREEMIUM_CATEGORY_LIMIT = 5; // Max custom categories for free users

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'uncategorized', name: 'Uncategorized', userId: null },
  { id: 'default-electronics', name: 'Electronics', userId: null },
  { id: 'default-grocery', name: 'Grocery', userId: null },
  { id: 'default-home', name: 'Home Appliances', userId: null },
  { id: 'default-health', name: 'Health', userId: null },
  { id: 'default-fashion', name: 'Fashion', userId: null },
];


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

export interface Category {
  id: string;
  name: string;
  userId: string | null; // null for default categories, userId for custom ones
}

export interface List {
  id: string;
  userId: string;
  name: string;
  budgetLimit: number;
  defaultCategory: string; // ID of a category
}

export interface BudgetItem {
  limit: number;
  spent: number;
  lastSetDate: string | null; // YYYY-MM-DD
  dailySpent: { [date: string]: number }; // Tracks daily spending for reset
}

interface AppState {
  userId: string | null; // Can be anonymous or authenticated user ID
  theme: string;
  currency: Currency;
  lists: List[];
  selectedListId: string | null;
  shoppingListItems: ShoppingListItem[];
  categories: Category[];
  isLoading: boolean;
  isPremium: boolean;
  budget: BudgetItem;
}

interface AppContextProps {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  formatCurrency: (amount: number) => string;
  isLoading: boolean; // Expose isLoading for consumers
}

const defaultCurrency: Currency = { code: 'USD', symbol: '$', name: 'US Dollar' };
const defaultThemeId = 'cyberpunk-cyan'; // Default theme

const initialState: AppState = {
  userId: null, // Starts as null until determined
  theme: defaultThemeId,
  currency: defaultCurrency,
  lists: [],
  selectedListId: null,
  shoppingListItems: [],
  categories: [...DEFAULT_CATEGORIES],
  isLoading: true,
  isPremium: false,
  budget: { limit: 0, spent: 0, lastSetDate: null, dailySpent: {} },
};

type Action =
  | { type: 'LOAD_STATE'; payload: Partial<AppState> } // For initial local storage load
  | { type: 'LOAD_STATE_FROM_API'; payload: Partial<AppState> } // For data from backend
  | { type: 'SET_USER_ID'; payload: string | null }
  | { type: 'SET_THEME'; payload: string }
  | { type: 'SET_CURRENCY'; payload: Currency }
  | { type: 'ADD_LIST'; payload: List }
  | { type: 'UPDATE_LIST'; payload: List }
  | { type: 'DELETE_LIST'; payload: string }
  | { type: 'SELECT_LIST'; payload: string | null }
  | { type: 'ADD_SHOPPING_ITEM'; payload: ShoppingListItem }
  | { type: 'UPDATE_SHOPPING_ITEM'; payload: ShoppingListItem }
  | { type: 'REMOVE_SHOPPING_ITEM'; payload: string }
  | { type: 'TOGGLE_SHOPPING_ITEM'; payload: string }
  | { type: 'ADD_CATEGORY'; payload: Category }
  | { type: 'UPDATE_CATEGORY'; payload: { id: string; name: string } }
  | { type: 'REMOVE_CATEGORY'; payload: { categoryId: string; reassignToId?: string } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_PREMIUM_STATUS'; payload: boolean }
  | { type: 'LOAD_USER_PREFERENCES'; payload: { currency?: Currency, theme?: string, isPremium?: boolean } }
  | { type: 'UPDATE_BUDGET'; payload: Partial<BudgetItem> }
  | { type: 'RESET_DAILY_SPENT'; payload: { today: string } }
  | { type: 'RESET_STATE_FOR_LOGOUT' };


const mergeCategories = (defaultCats: Category[], userCats: Category[]): Category[] => {
  const categoryMap = new Map<string, Category>();
  defaultCats.forEach(cat => categoryMap.set(cat.id, { ...cat, userId: null })); // Ensure default has null userId
  userCats.forEach(cat => categoryMap.set(cat.id, cat));
  return Array.from(categoryMap.values());
};

function appReducer(state: AppState, action: Action): AppState {
  let newState = { ...state };
  const currentUserIdForStorage = state.userId;

  switch (action.type) {
    case 'LOAD_STATE': // For initial local storage load or anonymous user
      newState = { ...initialState, ...action.payload, isLoading: false };
      newState.userId = action.payload.userId || initialState.userId; // Crucial: use payload's userId or initial null
      newState.categories = action.payload.categories && action.payload.categories.length > 0
        ? mergeCategories(DEFAULT_CATEGORIES, action.payload.categories)
        : [...DEFAULT_CATEGORIES];
      newState.isPremium = action.payload.isPremium ?? initialState.isPremium;
      newState.currency = action.payload.currency || initialState.currency;
      newState.theme = action.payload.theme || initialState.theme;
      newState.budget = action.payload.budget || initialState.budget;

      // Smartly set selectedListId if loading for a specific user
      if (newState.userId && newState.lists && newState.lists.length > 0) {
        const userLists = newState.lists.filter(l => l.userId === newState.userId);
        if (userLists.length > 0 && !userLists.some(l => l.id === newState.selectedListId)) {
          newState.selectedListId = userLists[0].id;
        } else if (userLists.length === 0) {
          newState.selectedListId = null;
        }
      } else {
        newState.selectedListId = null;
      }
      break;

    case 'LOAD_STATE_FROM_API':
      newState = { ...state, ...action.payload, isLoading: false }; // API load complete
      newState.categories = action.payload.categories && action.payload.categories.length > 0
        ? mergeCategories(DEFAULT_CATEGORIES, action.payload.categories)
        : state.categories; // Merge with existing if API doesn't send any
      newState.isPremium = action.payload.isPremium !== undefined ? action.payload.isPremium : state.isPremium;
      newState.currency = action.payload.currency || state.currency;
      newState.lists = action.payload.lists !== undefined ? action.payload.lists : state.lists;
      newState.shoppingListItems = action.payload.shoppingListItems !== undefined ? action.payload.shoppingListItems : state.shoppingListItems;

      if (newState.userId && newState.lists && newState.lists.length > 0) {
        const userListsFromApi = newState.lists.filter(l => l.userId === newState.userId);
        if (userListsFromApi.length > 0) {
          const currentSelectedListStillExists = userListsFromApi.some(l => l.id === state.selectedListId);
          newState.selectedListId = currentSelectedListStillExists ? state.selectedListId : userListsFromApi[0].id;
        } else {
          newState.selectedListId = null;
        }
      } else if (newState.lists && newState.lists.length === 0) {
         newState.selectedListId = null;
      }
      break;

    case 'SET_USER_ID':
      const previousUserId = state.userId;
      newState = { ...state, userId: action.payload, isLoading: true }; // Set loading to true as we might fetch new data
      if (action.payload === null) { // Logging OUT
        console.log("AppReducer: User logging out. Resetting to defaults for anonymous user.");
        const anonId = `anon_${uuidv4()}`;
        localStorage.setItem(ANONYMOUS_USER_ID_KEY, anonId);
        newState = {
            ...initialState,
            userId: anonId, // Set new anonymous ID
            isLoading: false, // Done with logout processing for now
            currency: state.currency, // Persist user's chosen currency if desired, or reset
            theme: state.theme,       // Persist user's chosen theme if desired, or reset
        };
        if (previousUserId && typeof window !== 'undefined') {
          localStorage.removeItem(`${LOCAL_STORAGE_KEY_PREFIX}${previousUserId}`);
        }
      } else if (action.payload !== previousUserId) { // Logging IN or switching user
        console.log(`AppReducer: User ID set to ${action.payload}. Previous: ${previousUserId || 'none'}.`);
        // Clear data specific to the previous user if it wasn't an anonymous user, or if switching from anon to logged in.
        // The effect in AppProvider will fetch data for the new authenticated user.
        newState.lists = [];
        newState.shoppingListItems = [];
        newState.selectedListId = null;
        newState.categories = [...DEFAULT_CATEGORIES];
        newState.isPremium = false; // Will be updated from API/AuthContext
        newState.budget = { limit: 0, spent: 0, lastSetDate: null, dailySpent: {} };
      }
      break;

    case 'SET_THEME':
      newState = { ...state, theme: action.payload };
      break;
    case 'SET_CURRENCY':
      newState = { ...state, currency: action.payload };
      break;
    case 'LOAD_USER_PREFERENCES':
        newState = {
            ...state,
            ...(action.payload.currency && { currency: action.payload.currency }),
            ...(action.payload.theme && { theme: action.payload.theme }),
            isPremium: action.payload.isPremium !== undefined ? action.payload.isPremium : state.isPremium,
        };
        break;
    case 'ADD_LIST':
      if (!state.userId) { console.warn("Cannot add list: No user ID"); return state; }
      const userListsOnAdd = newState.lists.filter(l => l.userId === state.userId);
      if (!state.isPremium && userListsOnAdd.length >= FREEMIUM_LIST_LIMIT) {
        console.warn("Freemium list limit reached.");
        // Potentially dispatch a toast/notification here
        return state;
      }
      newState.lists = [...newState.lists, { ...action.payload, userId: state.userId }];
      // If this is the very first list created by this user, select it.
      if (userListsOnAdd.length === 0) {
        newState.selectedListId = action.payload.id;
      }
      break;
    case 'UPDATE_LIST':
      if (!state.userId || action.payload.userId !== state.userId) return state;
      newState.lists = newState.lists.map(list => list.id === action.payload.id ? { ...action.payload, userId: state.userId } : list);
      break;
    case 'DELETE_LIST':
      const listToDelete = newState.lists.find(l => l.id === action.payload);
      if (!listToDelete || !state.userId || listToDelete.userId !== state.userId) return state;
      newState.lists = newState.lists.filter(list => list.id !== action.payload);
      newState.shoppingListItems = newState.shoppingListItems.filter(item => item.listId !== action.payload || item.userId !== state.userId);
      if (newState.selectedListId === action.payload) {
        const userListsAfterDelete = newState.lists.filter(l => l.userId === state.userId);
        newState.selectedListId = userListsAfterDelete.length > 0 ? userListsAfterDelete[0].id : null;
      }
      break;
    case 'SELECT_LIST':
        const listToSelect = newState.lists.find(l => l.id === action.payload);
        if (action.payload !== null && (!listToSelect || (state.userId && listToSelect.userId !== state.userId))) {
            return state;
        }
        newState.selectedListId = action.payload;
        // Reset budget display for the newly selected list if applicable
        const today = format(new Date(), 'yyyy-MM-dd');
        const dailySpentForSelectedList = listToSelect ? (state.budget.dailySpent[today] || 0) : 0; // This needs better list-specific tracking
        // newState.budget = { ...state.budget, spent: dailySpentForSelectedList }; // This logic needs rethinking for list-specific budgets
      break;
    case 'ADD_SHOPPING_ITEM':
      if (!state.userId || !action.payload.listId ) {
        console.error("Attempted to add item without listId or current userId");
        return state;
      }
      newState.shoppingListItems = [...newState.shoppingListItems, { ...action.payload, userId: state.userId }];
      break;
    case 'UPDATE_SHOPPING_ITEM':
      if (!state.userId || action.payload.userId !== state.userId) return state;
      newState.shoppingListItems = newState.shoppingListItems.map(item => item.id === action.payload.id ? { ...action.payload, userId: state.userId } : item);
      break;
    case 'REMOVE_SHOPPING_ITEM':
      const itemToRemove = newState.shoppingListItems.find(item => item.id === action.payload);
      if (!itemToRemove || !state.userId || itemToRemove.userId !== state.userId) return state;
      newState.shoppingListItems = newState.shoppingListItems.filter(item => item.id !== action.payload);
      break;
    case 'TOGGLE_SHOPPING_ITEM':
      const itemToToggle = newState.shoppingListItems.find(item => item.id === action.payload);
      if (!itemToToggle || !state.userId || itemToToggle.userId !== state.userId) return state;
      newState.shoppingListItems = newState.shoppingListItems.map(item =>
        item.id === action.payload ? { ...item, checked: !item.checked, dateAdded: Date.now() } : item
      );
      break;
    case 'ADD_CATEGORY':
      if (!state.userId) { console.warn("Cannot add category: No user ID"); return state; }
      const userCustomCategories = newState.categories.filter(c => c.userId === state.userId);
      if (!state.isPremium && userCustomCategories.length >= FREEMIUM_CATEGORY_LIMIT) {
         console.warn("Freemium custom category limit reached.");
         return state;
      }
      newState.categories = [...newState.categories, { ...action.payload, userId: state.userId }]; // Ensure new categories are tied to user
      break;
    case 'UPDATE_CATEGORY':
      const categoryToUpdate = newState.categories.find(c => c.id === action.payload.id);
      if (!categoryToUpdate) return state;
      // Only allow owner to update their custom categories, or premium users to update defaults
      if ((categoryToUpdate.userId && categoryToUpdate.userId !== state.userId) || (categoryToUpdate.userId === null && !state.isPremium)) {
          console.warn("User not authorized to update this category."); return state;
      }
      newState.categories = newState.categories.map(cat => cat.id === action.payload.id ? { ...cat, name: action.payload.name } : cat);
      break;
    case 'REMOVE_CATEGORY':
      const categoryToRemove = newState.categories.find(c => c.id === action.payload.categoryId);
      if (!categoryToRemove || categoryToRemove.id === 'uncategorized') return state; // Cannot delete 'uncategorized'
       // Only allow owner to delete their custom categories, or premium users to delete defaults
      if ((categoryToRemove.userId && categoryToRemove.userId !== state.userId) || (categoryToRemove.userId === null && !state.isPremium)) {
          console.warn("User not authorized to delete this category."); return state;
      }
      newState.categories = newState.categories.filter(cat => cat.id !== action.payload.categoryId);
      if (state.userId) {
        const reassignId = action.payload.reassignToId || 'uncategorized';
        newState.shoppingListItems = newState.shoppingListItems.map(item =>
          item.category === action.payload.categoryId && item.userId === state.userId ? { ...item, category: reassignId } : item
        );
        newState.lists = newState.lists.map(list =>
          list.defaultCategory === action.payload.categoryId && list.userId === state.userId ? { ...list, defaultCategory: reassignId } : list
        );
      }
      break;
    case 'SET_LOADING':
      newState = { ...state, isLoading: action.payload };
      break;
    case 'SET_PREMIUM_STATUS':
      newState = { ...state, isPremium: action.payload };
      break;
    case 'UPDATE_BUDGET':
      newState.budget = { ...state.budget, ...action.payload };
      break;
    case 'RESET_DAILY_SPENT':
      newState.budget = { ...state.budget, spent: 0, lastSetDate: action.payload.today, dailySpent: { [action.payload.today]: 0 } };
      break;
     case 'RESET_STATE_FOR_LOGOUT':
      const anonIdAfterLogout = `anon_${uuidv4()}`;
      localStorage.setItem(ANONYMOUS_USER_ID_KEY, anonIdAfterLogout);
      if (state.userId && typeof window !== 'undefined') {
        localStorage.removeItem(`${LOCAL_STORAGE_KEY_PREFIX}${state.userId}`);
      }
      newState = {
        ...initialState,
        userId: anonIdAfterLogout,
        isLoading: false,
        currency: state.currency, // Persist currency or reset to default
        theme: state.theme, // Persist theme or reset to default
      };
      break;
    default:
      newState = state;
  }

  // Save to localStorage for the current user (authenticated or anonymous)
  if (newState.userId && typeof window !== 'undefined' && action.type !== 'SET_LOADING' && action.type !== 'LOAD_STATE' && action.type !== 'LOAD_STATE_FROM_API') {
    try {
      const stateToSave = { ...newState, isLoading: undefined };
      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${newState.userId}`, JSON.stringify(stateToSave));
    } catch (error) {
      console.error("Failed to save state to localStorage for user:", newState.userId, error);
    }
  }
  return newState;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [isInitialDataLoaded, setIsInitialDataLoaded] = useState(false);

  // Effect for loading initial local state (anonymous or from localStorage)
  useEffect(() => {
    const loadInitialLocalState = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      console.log("AppProvider: Loading initial local state...");

      let currentUserId = state.userId; // Get from AuthContext if already set, or from localStorage for anon
      if (!currentUserId) {
        currentUserId = localStorage.getItem(ANONYMOUS_USER_ID_KEY);
        if (!currentUserId) {
          currentUserId = `anon_${uuidv4()}`;
          localStorage.setItem(ANONYMOUS_USER_ID_KEY, currentUserId);
        }
      }
      console.log("AppProvider: Determined userId for local state:", currentUserId);

      let loadedState: Partial<AppState> = { userId: currentUserId };

      const savedStateRaw = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${currentUserId}`);
      if (savedStateRaw) {
        try {
          const parsedState = JSON.parse(savedStateRaw) as Omit<AppState, 'isLoading'>;
          loadedState = { ...parsedState, userId: currentUserId }; // Ensure currentUserId is used
          console.log("AppProvider: Loaded state from localStorage for user:", currentUserId);
        } catch (e) {
          console.error(`Failed to parse state for user ${currentUserId}:`, e);
        }
      } else {
         console.log("AppProvider: No saved state in localStorage for user:", currentUserId);
      }
      
      if (!loadedState.currency || loadedState.currency.code === defaultCurrency.code) {
        try {
          const detectedCurrency = await getUserCurrency();
          loadedState.currency = detectedCurrency || defaultCurrency;
        } catch (e) {
          console.error("AppProvider: Currency auto-detection error:", e);
          loadedState.currency = defaultCurrency;
        }
      }
      
      dispatch({ type: 'LOAD_STATE', payload: loadedState });
      setIsInitialDataLoaded(true);
      console.log("AppProvider: Initial local state processing finished. User ID in context:", loadedState.userId);
    };
    
    // Only run this if AppContext's userId is not yet set by AuthContext, or if it's anonymous
    // This ensures that if AuthContext provides an authenticated userId first, we don't overwrite with anon logic.
    if (!state.userId || state.userId.startsWith('anon_')) {
        if (!isInitialDataLoaded) {
            loadInitialLocalState();
        }
    } else if (state.userId && !state.userId.startsWith('anon_') && !isInitialDataLoaded) {
        // Authenticated user ID is set by AuthContext, but local data for this user might not be loaded.
        // Or, initial data load might have happened for anon, then user logged in.
        // This path should be covered by the fetchApiDataForUser effect.
        // For now, we can mark initial local load as done for an auth user.
        setIsInitialDataLoaded(true); 
        dispatch({ type: 'SET_LOADING', payload: false }); // Assume auth context will trigger API fetch
    }


  }, [isInitialDataLoaded, state.userId]); // Depend on state.userId to re-evaluate if it changes early

  // Effect for fetching API data for authenticated (non-anonymous) users
  useEffect(() => {
    const fetchApiDataForUser = async () => {
      if (state.userId && !state.userId.startsWith('anon_') && isInitialDataLoaded) {
        console.log(`AppContext: Authenticated user ${state.userId} detected, fetching API data...`);
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
          const apiResponse = await fetchFromApi(`data/index.php`, { method: 'GET' });
          
          if (apiResponse.success && apiResponse.data) {
            const { lists = [], items = [], categories: apiCategories = [], user_preferences = {} } = apiResponse.data;
            const apiPayload: Partial<AppState> = {
              lists,
              shoppingListItems: items,
              categories: apiCategories,
              isPremium: user_preferences.is_premium !== undefined ? user_preferences.is_premium : false,
              currency: user_preferences.currency || state.currency, // Prefer API currency
            };
            dispatch({ type: 'LOAD_STATE_FROM_API', payload: apiPayload });
          } else {
            console.error("Failed to fetch API data for authenticated user:", apiResponse.message);
            dispatch({ type: 'SET_LOADING', payload: false });
          }
        } catch (error) {
          console.error("Error fetching API data for authenticated user:", error);
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } else if ((state.userId && state.userId.startsWith('anon_') || !state.userId) && isInitialDataLoaded && state.isLoading) {
        console.log("AppContext: Anonymous or no user, initial load done. Setting loading false.");
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    if (isInitialDataLoaded) {
        fetchApiDataForUser();
    }
  }, [state.userId, isInitialDataLoaded, dispatch]);


  const formatCurrency = useCallback((amount: number) => {
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: state.currency.code,
      }).format(amount);
    } catch (error) {
      // Fallback for invalid currency codes
      return `${state.currency.symbol || '$'}${amount.toFixed(2)}`;
    }
  }, [state.currency]);

  return (
    <AppContext.Provider value={{ state, dispatch, formatCurrency, isLoading: state.isLoading }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextProps => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
