// src/context/app-context.tsx
"use client";

import React, { createContext, useContext, useReducer, useEffect, useState, useCallback, type ReactNode } from 'react';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { getUserCurrency, type Currency } from '@/services/currency';
import { fetchFromApi } from '@/lib/api';

const LOCAL_STORAGE_KEY_PREFIX = 'neonShoppingState_v4_user_';
const ANONYMOUS_USER_ID_KEY = 'neon_anonymous_user_id_v2';


export const FREEMIUM_LIST_LIMIT = 3;
export const FREEMIUM_CATEGORY_LIMIT = 5;

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
  dateAdded: number;
}

export interface Category {
  id: string;
  name: string;
  userId: string | null;
}

export interface List {
  id: string;
  userId: string;
  name: string;
  budgetLimit: number;
  defaultCategory: string;
}

export interface UserPreferences {
    currency: Currency;
    isPremium: boolean;
    theme: string;
}

interface AppState {
  userId: string | null;
  theme: string;
  currency: Currency;
  lists: List[];
  selectedListId: string | null;
  shoppingListItems: ShoppingListItem[];
  categories: Category[];
  isLoading: boolean;
  isPremium: boolean;
}

interface AppContextProps {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  formatCurrency: (amount: number) => string;
  isLoading: boolean; // Expose AppContext's own loading state
}

const defaultCurrency: Currency = { code: 'USD', symbol: '$', name: 'US Dollar' };
const defaultThemeId = 'cyberpunk-cyan';

const initialState: AppState = {
  userId: null,
  theme: defaultThemeId,
  currency: defaultCurrency,
  lists: [],
  selectedListId: null,
  shoppingListItems: [],
  categories: [...DEFAULT_CATEGORIES],
  isLoading: true,
  isPremium: false,
};

type Action =
  | { type: 'LOAD_STATE'; payload: Partial<AppState> & { userId: string | null } } // Ensure userId is part of payload
  | { type: 'LOAD_API_DATA'; payload: { lists: List[]; items: ShoppingListItem[]; categories: Category[]; userPreferences: Partial<UserPreferences> } }
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
  | { type: 'ADD_CATEGORY'; payload: Pick<Category, 'name'> } // Only name needed for adding custom category
  | { type: 'UPDATE_CATEGORY'; payload: { id: string; name: string } }
  | { type: 'REMOVE_CATEGORY'; payload: { categoryId: string; reassignToId?: string } }
  | { type: 'SET_APP_LOADING'; payload: boolean } // Renamed for clarity
  | { type: 'SET_PREMIUM_STATUS'; payload: boolean }
  | { type: 'LOAD_USER_PREFERENCES'; payload: Partial<UserPreferences> }
  | { type: 'RESET_STATE_FOR_LOGOUT'};


const mergeCategories = (defaultCats: Category[], userCats: Category[]): Category[] => {
  const categoryMap = new Map<string, Category>();
  defaultCats.forEach(cat => categoryMap.set(cat.id, { ...cat, userId: null }));
  userCats.forEach(cat => categoryMap.set(cat.id, cat)); // User cats will have their userId
  return Array.from(categoryMap.values());
};


function appReducer(state: AppState, action: Action): AppState {
  let newState = { ...state };
  // const currentUserIdForStorage = state.userId; // This was problematic, use newState.userId for saving

  switch (action.type) {
    case 'LOAD_STATE': {
      const { userId: loadedUserIdFromPayload, ...restOfPayloadFromStorage } = action.payload;
      const finalUserIdForLoadState = loadedUserIdFromPayload; // Use payload's userId directly

      let shouldApiFetchFollow = false;
      if (finalUserIdForLoadState && !finalUserIdForLoadState.startsWith('anon_')) {
          shouldApiFetchFollow = true; // Expect API fetch for authenticated users
      }
      
      newState = {
        ...initialState, // Start from a clean slate
        ...restOfPayloadFromStorage, // Apply stored values (if any)
        userId: finalUserIdForLoadState, // Crucially set the correct userId
        // isLoading will be true if an API fetch is expected, false otherwise (for anon or no user)
        isLoading: shouldApiFetchFollow,
      };
      // Merge categories: use stored categories if available, otherwise defaults
      newState.categories = restOfPayloadFromStorage.categories && restOfPayloadFromStorage.categories.length > 0
        ? mergeCategories(DEFAULT_CATEGORIES, restOfPayloadFromStorage.categories.filter(c => c.userId === finalUserIdForLoadState || c.userId === null))
        : [...DEFAULT_CATEGORIES];
      
      newState.isPremium = restOfPayloadFromStorage.isPremium ?? initialState.isPremium;
      newState.currency = restOfPayloadFromStorage.currency || initialState.currency;
      newState.theme = restOfPayloadFromStorage.theme || initialState.theme;

       // Select first list if available for the current user
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
    }
    case 'LOAD_API_DATA': {
      const { lists, items, categories: apiCategories, userPreferences } = action.payload;
      newState = {
        ...state,
        lists: lists || state.lists, // These lists are already user-specific from API
        shoppingListItems: items || state.shoppingListItems, // These items are already user-specific
        categories: apiCategories ? mergeCategories(DEFAULT_CATEGORIES, apiCategories) : state.categories,
        currency: userPreferences.currency || state.currency,
        isPremium: userPreferences.isPremium !== undefined ? userPreferences.isPremium : state.isPremium,
        theme: userPreferences.theme || state.theme,
        isLoading: false, // API data loaded, set loading to false
      };
      // After loading API data, intelligently select a list for the current user
      if (newState.userId && newState.lists && newState.lists.length > 0) {
         // const userListsFromApi = newState.lists.filter(l => l.userId === newState.userId); // Not needed if API returns user-specific
        const userListsFromApi = newState.lists;
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
    }
    case 'SET_USER_ID': {
      const previousUserId = state.userId;
      newState = { ...state, userId: action.payload, isLoading: true };
      if (action.payload === null && previousUserId) { // Logging OUT
        if (typeof window !== 'undefined') {
          localStorage.removeItem(`${LOCAL_STORAGE_KEY_PREFIX}${previousUserId}`);
        }
        const newAnonId = `anon_${uuidv4()}`;
        localStorage.setItem(ANONYMOUS_USER_ID_KEY, newAnonId);
        newState = {
          ...initialState,
          userId: newAnonId,
          isLoading: false, 
          currency: state.currency,
          theme: state.theme,
        };
      } else if (action.payload && action.payload !== previousUserId) { // Logging IN or switching
        newState.lists = [];
        newState.shoppingListItems = [];
        newState.selectedListId = null;
        newState.categories = [...DEFAULT_CATEGORIES];
        newState.isPremium = false;
         if (previousUserId && previousUserId.startsWith('anon_') && typeof window !== 'undefined') {
            localStorage.removeItem(ANONYMOUS_USER_ID_KEY);
            localStorage.removeItem(`${LOCAL_STORAGE_KEY_PREFIX}${previousUserId}`);
         }
      }
      break;
    }
    case 'LOAD_USER_PREFERENCES':
        newState = {
            ...state,
            ...action.payload, // currency, isPremium, theme
        };
        break;
    case 'SET_THEME':
      newState = { ...state, theme: action.payload };
      break;
    case 'SET_CURRENCY':
      newState = { ...state, currency: action.payload };
      break;
    case 'ADD_LIST': {
      if (!state.userId) return state;
      const userListsOnAdd = newState.lists.filter(l => l.userId === state.userId);
      if (!state.isPremium && userListsOnAdd.length >= FREEMIUM_LIST_LIMIT) {
         console.warn("Freemium list limit reached."); return state;
      }
      const newListWithUserId = { ...action.payload, userId: state.userId };
      newState.lists = [...newState.lists, newListWithUserId];
      if (userListsOnAdd.length === 0) {
        newState.selectedListId = newListWithUserId.id;
      }
      break;
    }
    case 'UPDATE_LIST': {
      if (!state.userId || action.payload.userId !== state.userId) return state;
      newState.lists = newState.lists.map(list =>
        list.id === action.payload.id ? { ...action.payload, userId: state.userId } : list
      );
      break;
    }
    case 'DELETE_LIST': {
      const listToDelete = newState.lists.find(l => l.id === action.payload);
      if (!listToDelete || !state.userId || listToDelete.userId !== state.userId) return state;
      newState.lists = newState.lists.filter(list => list.id !== action.payload);
      newState.shoppingListItems = newState.shoppingListItems.filter(item =>
        item.listId !== action.payload || item.userId !== state.userId
      );
      if (newState.selectedListId === action.payload) {
        const userListsAfterDelete = newState.lists.filter(l => l.userId === state.userId);
        newState.selectedListId = userListsAfterDelete.length > 0 ? userListsAfterDelete[0].id : null;
      }
      break;
    }
    case 'SELECT_LIST': {
      const listToSelect = newState.lists.find(l => l.id === action.payload);
      if (action.payload !== null && (!listToSelect || (state.userId && listToSelect.userId !== state.userId))) {
          return state;
      }
      newState.selectedListId = action.payload;
      break;
    }
    case 'ADD_SHOPPING_ITEM': {
       if (!state.userId || !action.payload.listId || action.payload.userId !== state.userId) {
         console.error("Attempted to add item with invalid listId or userId mismatch");
         return state;
       }
      newState.shoppingListItems = [...newState.shoppingListItems, action.payload];
      break;
    }
    case 'UPDATE_SHOPPING_ITEM': {
      if (!state.userId || action.payload.userId !== state.userId) return state;
      newState.shoppingListItems = newState.shoppingListItems.map(item =>
        item.id === action.payload.id ? { ...action.payload, userId: state.userId } : item
      );
      break;
    }
    case 'REMOVE_SHOPPING_ITEM': {
      const itemToRemove = newState.shoppingListItems.find(item => item.id === action.payload);
      if (!itemToRemove || !state.userId || itemToRemove.userId !== state.userId) return state;
      newState.shoppingListItems = newState.shoppingListItems.filter(item => item.id !== action.payload);
      break;
    }
    case 'TOGGLE_SHOPPING_ITEM': {
      const itemToToggle = newState.shoppingListItems.find(item => item.id === action.payload);
      if (!itemToToggle || !state.userId || itemToToggle.userId !== state.userId) return state;
      newState.shoppingListItems = newState.shoppingListItems.map(item =>
        item.id === action.payload ? { ...item, checked: !item.checked, dateAdded: Date.now() } : item
      );
      break;
    }
    case 'ADD_CATEGORY': {
      if (!state.userId) { console.warn("Cannot add category: No user ID"); return state; }
      const userCustomCategories = newState.categories.filter(c => c.userId === state.userId);
      if (!state.isPremium && userCustomCategories.length >= FREEMIUM_CATEGORY_LIMIT) {
         console.warn("Freemium custom category limit reached."); return state;
      }
      const newCategory: Category = { id: `cat-${uuidv4()}`, name: action.payload.name, userId: state.userId };
      newState.categories = [...newState.categories, newCategory];
      break;
    }
    case 'UPDATE_CATEGORY': {
      const categoryToUpdate = newState.categories.find(c => c.id === action.payload.id);
      if (!categoryToUpdate) return state;
      // Allow update if it's a user's custom category OR if it's a default one AND user is premium
      const canUpdate = (categoryToUpdate.userId === state.userId) || (categoryToUpdate.userId === null && state.isPremium);
      if (!canUpdate) {
          console.warn("User not authorized to update this category."); return state;
      }
      newState.categories = newState.categories.map(cat =>
        cat.id === action.payload.id ? { ...cat, name: action.payload.name } : cat
      );
      break;
    }
    case 'REMOVE_CATEGORY': {
      const categoryToRemove = newState.categories.find(c => c.id === action.payload.categoryId);
      if (!categoryToRemove || categoryToRemove.id === 'uncategorized') return state;
      // Allow removal if it's a user's custom category OR if it's a default one AND user is premium
      const canRemove = (categoryToRemove.userId === state.userId) || (categoryToRemove.userId === null && state.isPremium);
      if (!canRemove) {
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
    }
    case 'SET_APP_LOADING': // Renamed action type
      newState = { ...state, isLoading: action.payload };
      break;
    case 'SET_PREMIUM_STATUS':
      newState = { ...state, isPremium: action.payload };
      break;
    case 'RESET_STATE_FOR_LOGOUT': {
        const newAnonIdForLogout = `anon_${uuidv4()}`;
        if (typeof window !== 'undefined') {
            if (state.userId) localStorage.removeItem(`${LOCAL_STORAGE_KEY_PREFIX}${state.userId}`);
            localStorage.setItem(ANONYMOUS_USER_ID_KEY, newAnonIdForLogout);
        }
        newState = {
            ...initialState,
            userId: newAnonIdForLogout,
            isLoading: false,
            currency: state.currency,
            theme: state.theme,
        };
        break;
      }
    default:
      newState = state;
  }

  if (newState.userId && typeof window !== 'undefined' && action.type !== 'SET_APP_LOADING' && action.type !== 'LOAD_STATE') {
    try {
      const stateToSave = { ...newState, isLoading: undefined };
      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${newState.userId}`, JSON.stringify(stateToSave));
      console.log(`AppContext: Saved state to localStorage for user: ${newState.userId}`, {listsCount: stateToSave.lists?.length});
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

  useEffect(() => {
    const loadInitialLocalData = async () => {
      console.log("AppProvider: Attempting to load initial local data. Current state.userId before load:", state.userId);
      dispatch({ type: 'SET_APP_LOADING', payload: true });

      let userIdToLoadFor = state.userId; // Might be null or an auth ID from AuthContext (if it ran first)
      if (!userIdToLoadFor) {
        userIdToLoadFor = localStorage.getItem(ANONYMOUS_USER_ID_KEY);
        if (!userIdToLoadFor) {
          userIdToLoadFor = `anon_${uuidv4()}`;
          localStorage.setItem(ANONYMOUS_USER_ID_KEY, userIdToLoadFor);
        }
        console.log("AppProvider: No existing userId in state, using/generating anonymous ID:", userIdToLoadFor);
      }

      let loadedStateFromStorage: Partial<AppState> = {};
      const savedStateRaw = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${userIdToLoadFor}`);
      if (savedStateRaw) {
        try {
          const parsedState = JSON.parse(savedStateRaw) as Omit<AppState, 'isLoading'>;
          loadedStateFromStorage = { ...parsedState };
          console.log(`AppProvider: Loaded state from localStorage for user: ${userIdToLoadFor}`);
        } catch (e) {
          console.error(`Failed to parse state from localStorage for user ${userIdToLoadFor}:`, e);
        }
      } else {
         console.log(`AppProvider: No saved state in localStorage for user: ${userIdToLoadFor}`);
      }
      
      if (!loadedStateFromStorage.currency) {
        try {
          const detectedCurrency = await getUserCurrency();
          loadedStateFromStorage.currency = detectedCurrency || defaultCurrency;
          if(detectedCurrency) console.log("AppProvider: Currency auto-detected:", detectedCurrency);
        } catch (e) {
          console.error("AppProvider: Currency auto-detection error:", e);
          loadedStateFromStorage.currency = defaultCurrency; // Fallback
        }
      }
      // Ensure the userId being dispatched is the one we decided to load for.
      // This is crucial for LOAD_STATE to correctly set isLoading.
      dispatch({ type: 'LOAD_STATE', payload: { ...loadedStateFromStorage, userId: userIdToLoadFor } });
      setIsInitialDataLoaded(true);
      console.log("AppProvider: Initial local data processing finished. User ID dispatched to LOAD_STATE:", userIdToLoadFor);
    };
    
    if (!isInitialDataLoaded && !state.userId?.startsWith('anon_')) { // Only run once if not already loaded
        loadInitialLocalData();
    } else if (!isInitialDataLoaded && state.userId?.startsWith('anon_')) {
        loadInitialLocalData(); // also load for anon user on first go
    } else if (isInitialDataLoaded && state.isLoading && !state.userId?.startsWith('anon_') && state.userId !== null) {
        // This case might be if user becomes authenticated and we need to ensure loading is false if no API call pending
        // However, the API fetch useEffect should handle this. For safety, if it's loaded, and context is loading, and it's an auth user
        // this might indicate something to check. For now, API fetch effect will set loading to false.
    } else if (isInitialDataLoaded && !state.isLoading && state.userId?.startsWith('anon_')) {
        // If initial data loaded, and it was for anon, and state.isLoading is false, we are good.
    }


  }, [isInitialDataLoaded, state.userId]); // Re-run if userId changes from AuthContext early

  useEffect(() => {
    const fetchApiDataForUser = async () => {
      if (state.userId && !state.userId.startsWith('anon_') && isInitialDataLoaded) {
        console.log(`AppContext: Authenticated user ${state.userId} detected, attempting to fetch API data...`);
        dispatch({ type: 'SET_APP_LOADING', payload: true }); // Ensure loading is true before API call
        try {
          const apiResponse = await fetchFromApi(`data/index.php`, { method: 'GET' });
          if (apiResponse.success && apiResponse.data) {
            const { lists = [], items = [], categories: apiCategories = [], user_preferences = {} } = apiResponse.data;
            dispatch({
              type: 'LOAD_API_DATA',
              payload: {
                lists,
                items,
                categories: apiCategories,
                userPreferences: {
                  currency: user_preferences.currency,
                  isPremium: user_preferences.is_premium,
                  theme: user_preferences.theme,
                }
              }
            });
             console.log(`AppContext: Successfully fetched API data for user ${state.userId}`);
          } else {
            console.error("AppContext: Failed to fetch or process API data for authenticated user:", apiResponse.message);
            dispatch({ type: 'SET_APP_LOADING', payload: false });
          }
        } catch (error) {
          console.error("AppContext: Error during API data fetch for authenticated user:", error);
          dispatch({ type: 'SET_APP_LOADING', payload: false });
        }
        // No finally here, LOAD_API_DATA sets isLoading to false
      } else if (state.userId && state.userId.startsWith('anon_') && isInitialDataLoaded && state.isLoading) {
        // If it's an anonymous user and initial load happened, and we are still loading, something is off.
        // This usually means LOAD_STATE for anonymous user should set isLoading to false.
        // The LOAD_STATE reducer was updated to handle this.
         console.log(`AppContext: Anonymous user ${state.userId} and initial data loaded. If isLoading is true, LOAD_STATE should have set it to false.`);
         if(state.isLoading) dispatch({ type: 'SET_APP_LOADING', payload: false });
      }
    };

    if (isInitialDataLoaded) {
        fetchApiDataForUser();
    }
  }, [state.userId, isInitialDataLoaded, dispatch]); // dispatch added as a dependency


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
