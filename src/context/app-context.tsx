// src/context/app-context.tsx
"use client";

import React, { createContext, useContext, useReducer, useEffect, useState, useCallback, type ReactNode } from 'react';
import { format, startOfDay, isSameDay } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { getUserCurrency, type Currency } from '@/services/currency';
import { fetchFromApi } from '@/lib/api';
import { useAuth, type User as AuthUser } from './auth-context';

const LOCAL_STORAGE_KEY_PREFIX = 'neonShoppingState_v4_user_';
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
  dateAdded: number; // Milliseconds timestamp
}

export interface Category {
  id: string;
  name: string;
  userId: string | null; // null for default/global categories
}

export interface List {
  id: string;
  userId: string;
  name: string;
  budgetLimit: number;
  defaultCategory: string; // ID of a category
}

interface UserPreferences {
  currency: Currency;
  isPremium: boolean;
}

interface AppState {
  userId: string | null; // Can be null initially or for logged-out state
  currency: Currency;
  lists: List[];
  selectedListId: string | null;
  shoppingListItems: ShoppingListItem[];
  categories: Category[];
  isLoading: boolean; // App-specific data loading
  isInitialDataLoaded: boolean; // Tracks if the very first load logic has run
  isPremium: boolean; // Synced from AuthContext based on backend data
}

interface AppContextProps {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  formatCurrency: (amount: number) => string;
  isLoading: boolean; // Combined loading state (app + auth)
}

const defaultCurrency: Currency = { code: 'USD', symbol: '$', name: 'US Dollar' };

const initialState: AppState = {
  userId: null,
  currency: defaultCurrency,
  lists: [],
  selectedListId: null,
  shoppingListItems: [],
  categories: [...DEFAULT_CATEGORIES],
  isLoading: true, // Start true until initial load sequence completes
  isInitialDataLoaded: false,
  isPremium: false,
};

type Action =
  | { type: 'LOAD_STATE'; payload: Partial<AppState> & { userId: string | null } }
  | { type: 'LOAD_DATA_FROM_API'; payload: { lists: List[]; items: ShoppingListItem[]; categories: Category[]; userPreferences: Partial<UserPreferences> } }
  | { type: 'SET_USER_CONTEXT_IN_APP'; payload: { userId: string | null; isPremium: boolean } }
  | { type: 'SET_CURRENCY'; payload: Currency }
  | { type: 'ADD_LIST'; payload: List }
  | { type: 'UPDATE_LIST'; payload: List }
  | { type: 'DELETE_LIST'; payload: string }
  | { type: 'SELECT_LIST'; payload: string | null }
  | { type: 'ADD_SHOPPING_ITEM'; payload: ShoppingListItem }
  | { type: 'UPDATE_SHOPPING_ITEM'; payload: ShoppingListItem }
  | { type: 'REMOVE_SHOPPING_ITEM'; payload: string }
  | { type: 'TOGGLE_SHOPPING_ITEM'; payload: string }
  | { type: 'ADD_CATEGORY'; payload: { name: string } } // Payload changed to just name
  | { type: 'UPDATE_CATEGORY'; payload: { id: string; name: string } }
  | { type: 'REMOVE_CATEGORY'; payload: { categoryId: string; reassignToId?: string } }
  | { type: 'SET_APP_LOADING'; payload: boolean }
  | { type: 'SET_PREMIUM_STATUS'; payload: boolean } // For direct control from PremiumPage
  | { type: 'RESET_APP_STATE_FOR_LOGOUT' };


const mergeCategories = (defaultCats: Category[], apiCats: Category[], currentUserId: string | null): Category[] => {
  const categoryMap = new Map<string, Category>();
  // Add default global categories first (userId is null)
  defaultCats.forEach(cat => categoryMap.set(cat.id, { ...cat, userId: null }));

  // Add/override with API categories (these can be global or user-specific)
  apiCats.forEach(cat => {
    // If API category has a userId, ensure it's for the current user or it's global (null userId from API)
    if (cat.userId === null || cat.userId === currentUserId) {
      categoryMap.set(cat.id, cat);
    }
  });
  return Array.from(categoryMap.values());
};


function appReducer(state: AppState, action: Action): AppState {
  let newState = { ...state };

  switch (action.type) {
    case 'LOAD_STATE': {
      const { userId: loadedUserId, ...restOfPayload } = action.payload;
      newState = {
        ...initialState,
        userId: loadedUserId,
        ...restOfPayload,
        currency: restOfPayload.currency || initialState.currency,
        categories: mergeCategories(DEFAULT_CATEGORIES, restOfPayload.categories || [], loadedUserId),
        isPremium: restOfPayload.isPremium ?? initialState.isPremium,
        isLoading: false, // LOAD_STATE signifies initial local/anon setup is done
        isInitialDataLoaded: true,
      };
      if (loadedUserId && newState.lists && Array.isArray(newState.lists) && newState.lists.length > 0) {
        const userLists = newState.lists.filter(l => l.userId === loadedUserId);
        if (userLists.length > 0) {
            const currentSelectedListIsValid = userLists.some(l => l.id === newState.selectedListId);
            newState.selectedListId = currentSelectedListIsValid ? newState.selectedListId : userLists[0].id;
        } else {
            newState.selectedListId = null;
        }
      } else {
        newState.selectedListId = null;
      }
      console.log("AppReducer: LOAD_STATE processed. UserID:", loadedUserId, "New state:", newState);
      break;
    }
    case 'LOAD_DATA_FROM_API': {
      const { lists, items, categories: apiCategories, userPreferences } = action.payload;
      newState = {
        ...state,
        lists: lists || state.lists,
        shoppingListItems: items || state.shoppingListItems,
        categories: apiCategories ? mergeCategories(DEFAULT_CATEGORIES, apiCategories, state.userId) : state.categories,
        currency: userPreferences.currency || state.currency,
        isPremium: userPreferences.isPremium !== undefined ? userPreferences.isPremium : state.isPremium,
        isLoading: false,
      };
      if (state.userId && newState.lists && Array.isArray(newState.lists)) {
        const userListsFromApi = newState.lists.filter(l => l.userId === state.userId);
        if (userListsFromApi.length > 0) {
          const currentSelectedListStillExists = userListsFromApi.some(l => l.id === state.selectedListId);
          newState.selectedListId = currentSelectedListStillExists ? state.selectedListId : userListsFromApi[0].id;
        } else {
          newState.selectedListId = null;
        }
      } else {
        newState.selectedListId = null;
      }
      console.log("AppReducer: LOAD_DATA_FROM_API. New state:", newState);
      break;
    }
    case 'SET_USER_CONTEXT_IN_APP': {
        const { userId: newUserId, isPremium: newIsPremium } = action.payload;
        const oldUserId = state.userId;
        newState = {
            ...state,
            userId: newUserId,
            isPremium: newIsPremium,
            isLoading: (newUserId && !newUserId.startsWith('anon_')), // Set loading true for authenticated users to trigger API fetch
        };
        if (newUserId !== oldUserId) {
            newState.lists = [];
            newState.shoppingListItems = [];
            newState.selectedListId = null;
            newState.categories = [...DEFAULT_CATEGORIES];
            if (typeof window !== 'undefined' && oldUserId && !oldUserId.startsWith('anon_')) {
                localStorage.removeItem(`${LOCAL_STORAGE_KEY_PREFIX}${oldUserId}`);
            }
        }
        console.log("AppReducer: SET_USER_CONTEXT_IN_APP. UserID:", newUserId, "Premium:", newIsPremium);
        break;
    }
    case 'SET_CURRENCY':
      newState = { ...state, currency: action.payload };
      if (state.userId && !state.userId.startsWith('anon_')) {
         fetchFromApi('user/preferences.php', { // Endpoint to save user preference
           method: 'POST',
           body: JSON.stringify({ currencyCode: action.payload.code, userId: state.userId }),
         }).catch(err => console.error("Failed to save currency preference to backend:", err));
      }
      break;
    case 'ADD_LIST': {
      if (!state.userId) return state;
      const userOwnedLists = newState.lists.filter(l => l.userId === state.userId);
      if (!state.isPremium && userOwnedLists.length >= FREEMIUM_LIST_LIMIT) {
        console.warn("Freemium list limit reached."); // Consider showing a toast
        return state;
      }
      const newListWithUserId = { ...action.payload, userId: state.userId };
      newState.lists = [...newState.lists, newListWithUserId];
      if (!newState.selectedListId || userOwnedLists.length === 0) {
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
        !(item.listId === action.payload && item.userId === state.userId)
      );
      if (newState.selectedListId === action.payload) {
        const userListsRemaining = newState.lists.filter(l => l.userId === state.userId);
        newState.selectedListId = userListsRemaining.length > 0 ? userListsRemaining[0].id : null;
      }
      break;
    }
    case 'SELECT_LIST': {
      const listToSelect = newState.lists.find(l => l.id === action.payload);
      if (action.payload === null || (listToSelect && state.userId && listToSelect.userId === state.userId)) {
          newState.selectedListId = action.payload;
      }
      break;
    }
    case 'ADD_SHOPPING_ITEM': {
       if (!state.userId || !action.payload.listId || action.payload.userId !== state.userId) return state;
      newState.shoppingListItems = [...newState.shoppingListItems, { ...action.payload, userId: state.userId }];
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
        item.id === action.payload ? { ...item, checked: !item.checked, dateAdded: Date.now(), userId: state.userId } : item
      );
      break;
    }
    case 'ADD_CATEGORY': {
      if (!state.userId) return state;
      const userCustomCategories = newState.categories.filter(c => c.userId === state.userId);
      if (!state.isPremium && userCustomCategories.length >= FREEMIUM_CATEGORY_LIMIT) {
        console.warn("Freemium custom category limit reached."); // Consider showing a toast
        return state;
      }
      const newCategory: Category = {
        id: uuidv4(),
        name: action.payload.name,
        userId: state.userId, // User-specific category
      };
      newState.categories = [...newState.categories, newCategory];
      break;
    }
    case 'UPDATE_CATEGORY': {
      const categoryToUpdate = newState.categories.find(c => c.id === action.payload.id);
      if (!categoryToUpdate) return state;
      const canUpdate = (categoryToUpdate.userId === state.userId) || (categoryToUpdate.userId === null && state.isPremium);
      if (!canUpdate) return state;
      newState.categories = newState.categories.map(cat =>
        cat.id === action.payload.id ? { ...cat, name: action.payload.name } : cat
      );
      break;
    }
    case 'REMOVE_CATEGORY': {
      const categoryToRemove = newState.categories.find(c => c.id === action.payload.categoryId);
      if (!categoryToRemove || categoryToRemove.id === 'uncategorized') return state;
      const canRemove = (categoryToRemove.userId === state.userId) || (categoryToRemove.userId === null && state.isPremium);
      if (!canRemove) return state;
      newState.categories = newState.categories.filter(cat => cat.id !== action.payload.categoryId);
      if (state.userId) {
        const reassignId = action.payload.reassignToId || 'uncategorized';
        newState.shoppingListItems = newState.shoppingListItems.map(item =>
          item.category === action.payload.categoryId && item.userId === state.userId ? { ...item, category: reassignId, userId: state.userId } : item
        );
        newState.lists = newState.lists.map(list =>
          list.defaultCategory === action.payload.categoryId && list.userId === state.userId ? { ...list, defaultCategory: reassignId, userId: state.userId } : item
        );
      }
      break;
    }
    case 'SET_APP_LOADING':
      newState = { ...state, isLoading: action.payload };
      break;
    case 'SET_PREMIUM_STATUS':
      newState = { ...state, isPremium: action.payload };
      break;
    case 'RESET_APP_STATE_FOR_LOGOUT': {
        const anonId = `anon_${uuidv4()}`;
        newState = {
            ...initialState,
            userId: anonId,
            currency: state.currency, // Preserve currency choice
            isLoading: false,
            isInitialDataLoaded: true, // Mark as loaded for the new anonymous session
        };
        console.log("AppReducer: RESET_APP_STATE_FOR_LOGOUT. New anon UserID:", anonId);
        if (typeof window !== 'undefined' && state.userId && !state.userId.startsWith('anon_')) {
          localStorage.removeItem(`${LOCAL_STORAGE_KEY_PREFIX}${state.userId}`);
          localStorage.setItem('anonymous_user_id', anonId); // Store new anon ID
        }
        // Persist initial state for the new anonymous user session
        localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${anonId}`, JSON.stringify(newState));
        break;
      }
    default:
      newState = state;
  }

  if (newState.userId && typeof window !== 'undefined' && action.type !== 'SET_APP_LOADING' && action.type !== 'LOAD_STATE') {
    try {
      const { isLoading: _omittedIsLoading, isInitialDataLoaded: _omittedIsInitial, ...stateToSave } = newState;
      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${newState.userId}`, JSON.stringify(stateToSave));
    } catch (error) {
      console.error("Failed to save state to localStorage:", error);
    }
  }
  return newState;
}

export const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { user: authUser, isAuthenticated, isLoading: authIsLoading } = useAuth();


  // Effect 1: Load initial state (once on mount or when auth state is first resolved)
  useEffect(() => {
    const loadInitialData = async () => {
      if (state.isInitialDataLoaded) {
        console.log("AppProvider: Initial data already marked as loaded, skipping full reload sequence.");
        return;
      }
      
      dispatch({ type: 'SET_APP_LOADING', payload: true });
      console.log("AppProvider: Starting initial data load sequence (Auth Loading:", authIsLoading, ")");

      let userIdToUse: string | null = null;
      let loadedStateFromStorage: Partial<Omit<AppState, 'isLoading' | 'isInitialDataLoaded'>> = {};

      // Determine User ID: Wait for auth to resolve.
      if (!authIsLoading) {
        if (authUser && isAuthenticated) {
          userIdToUse = authUser.id;
          console.log(`AppProvider: Authenticated user ID from AuthContext: ${userIdToUse}`);
          // Remove anon ID if user is now authenticated
          if (typeof window !== 'undefined') localStorage.removeItem('anonymous_user_id');
        } else {
          // Not authenticated, manage anonymous ID
          let storedAnonId = typeof window !== 'undefined' ? localStorage.getItem('anonymous_user_id') : null;
          if (storedAnonId) {
            userIdToUse = storedAnonId;
            console.log(`AppProvider: Using existing anonymous user ID: ${userIdToUse}`);
          } else {
            userIdToUse = `anon_${uuidv4()}`;
            if (typeof window !== 'undefined') localStorage.setItem('anonymous_user_id', userIdToUse);
            console.log(`AppProvider: Generated new anonymous user ID: ${userIdToUse}`);
          }
        }
      } else {
        console.log("AppProvider: AuthContext still loading, cannot determine definitive userId yet. Will re-run when auth resolves.");
        // Don't set isLoading to false here, wait for auth to finish.
        return; // Defer until auth state is clear
      }

      // Load state from localStorage for the determined user ID
      if (userIdToUse && typeof window !== 'undefined') {
        const storageKey = `${LOCAL_STORAGE_KEY_PREFIX}${userIdToUse}`;
        const storedStateRaw = localStorage.getItem(storageKey);
        if (storedStateRaw) {
          try {
            loadedStateFromStorage = JSON.parse(storedStateRaw);
            console.log(`AppProvider: Parsed stored state for user ${userIdToUse}.`);
          } catch (e) {
            console.error(`AppProvider: Failed to parse stored state for user ${userIdToUse}. Clearing. Error:`, e);
            localStorage.removeItem(storageKey);
          }
        } else {
          console.log(`AppProvider: No stored state for user ${userIdToUse}.`);
        }
      }

      // Currency Determination
      let currencyToSet: Currency = defaultCurrency;
      if (loadedStateFromStorage.currency) {
        currencyToSet = loadedStateFromStorage.currency;
        console.log(`AppProvider: Using currency from localStorage for user ${userIdToUse}: ${currencyToSet.code}`);
      } else if (userIdToUse && userIdToUse.startsWith('anon_')) { // Only detect for new anonymous users
        console.log(`AppProvider: New anonymous user ${userIdToUse}, attempting currency auto-detection...`);
        try {
          const detectedCurrency = await getUserCurrency();
          if (detectedCurrency) {
            currencyToSet = detectedCurrency;
            console.log(`AppProvider: Currency auto-detected: ${currencyToSet.code}`);
          } else {
            console.log("AppProvider: Currency auto-detection failed, using default.");
          }
        } catch (e) {
          console.error("AppProvider: Error during currency auto-detection:", e);
        }
      } else {
         console.log(`AppProvider: No currency in localStorage for user ${userIdToUse} (or user is authenticated without local pref yet). Using default: ${defaultCurrency.code}. API will override if needed.`);
      }

      // Dispatch LOAD_STATE to initialize app state
      // This marks isInitialDataLoaded as true and isLoading as false for anon users
      dispatch({
        type: 'LOAD_STATE',
        payload: {
          ...initialState, // Start from a clean slate for safety, then overlay
          ...loadedStateFromStorage,
          userId: userIdToUse,
          currency: currencyToSet,
          isPremium: authUser?.isPremium ?? false, // Sync premium status from authUser if available
          // categories will be merged inside the reducer
        },
      });

      // isLoading for authenticated users is handled by the API fetch effect
      if (userIdToUse && userIdToUse.startsWith('anon_')) {
        // For anonymous users, the "loading" related to initial setup is now done.
        // If `SET_APP_LOADING(false)` was already called by LOAD_STATE, this is redundant but harmless.
      }
    };

    loadInitialData();

  }, [authIsLoading, authUser, isAuthenticated, dispatch, state.isInitialDataLoaded]); // Added state.isInitialDataLoaded to prevent re-running


  // Effect 2: Sync with AuthContext (specifically for user ID and premium status changes post-initial load)
  useEffect(() => {
    if (authIsLoading || !state.isInitialDataLoaded) {
      return; // Wait for auth and initial app load to complete
    }

    const currentAppUserId = state.userId;
    const authContextUserId = authUser?.id;
    const authContextIsPremium = authUser?.isPremium ?? false;

    if (authUser && isAuthenticated) { // User is authenticated
      if (currentAppUserId !== authContextUserId || state.isPremium !== authContextIsPremium) {
        console.log(`AppProvider (AuthSync): Auth user changed or premium status mismatch. Updating AppContext for user ${authContextUserId}. IsPremium: ${authContextIsPremium}`);
        dispatch({
          type: 'SET_USER_CONTEXT_IN_APP',
          payload: { userId: authContextUserId!, isPremium: authContextIsPremium }
        });
        if (typeof window !== 'undefined') localStorage.setItem('last_active_user_id', authContextUserId!);
      }
    } else { // User is not authenticated (logged out or never logged in)
      if (currentAppUserId && !currentAppUserId.startsWith('anon_')) {
        // App still thinks a non-anonymous user is active, but AuthContext says no. Reset.
        console.log("AppProvider (AuthSync): User logged out. Dispatching RESET_APP_STATE_FOR_LOGOUT.");
        dispatch({ type: 'RESET_APP_STATE_FOR_LOGOUT' });
      } else if (!currentAppUserId) {
        // If somehow app's userId is null after initial load and user is not auth'd, ensure anon session
        const anonId = `anon_${uuidv4()}`;
        console.log(`AppProvider (AuthSync): Ensuring anonymous context. New anon UserID: ${anonId}`);
        dispatch({ type: 'SET_USER_CONTEXT_IN_APP', payload: { userId: anonId, isPremium: false }});
        if (typeof window !== 'undefined') localStorage.setItem('anonymous_user_id', anonId);
      }
       // If already anonymous and isPremium is false, state is consistent.
       if (currentAppUserId && currentAppUserId.startsWith('anon_') && state.isPremium) {
         dispatch({ type: 'SET_PREMIUM_STATUS', payload: false }); // Anon users cannot be premium
       }
    }
  }, [authUser, isAuthenticated, authIsLoading, state.userId, state.isPremium, state.isInitialDataLoaded, dispatch]);


  // Effect 3: Fetch API data for authenticated users
  useEffect(() => {
    const fetchApiDataForUser = async () => {
      // Only fetch if user is authenticated (non-anon), initial data has been loaded, and app is in a loading state (implies user just logged in or context changed)
      if (state.userId && !state.userId.startsWith('anon_') && state.isInitialDataLoaded && state.isLoading) {
        console.log(`AppProvider (APIFetch): Fetching API data for authenticated user ${state.userId}...`);
        try {
          const apiResponse = await fetchFromApi(`data/index.php`, { method: 'GET' }); // User ID is handled by session cookie
          if (apiResponse.success && apiResponse.data) {
            const { lists = [], items = [], categories: apiCategories = [], user_preferences = {} } = apiResponse.data;
            
            // Determine premium status: primarily from AuthContext (which gets it from session_status.php),
            // but allow API to override if it has more up-to-date info (e.g. just subscribed).
            const premiumFromApi = user_preferences.is_premium;
            const finalIsPremium = premiumFromApi !== undefined ? premiumFromApi : state.isPremium;

            dispatch({
              type: 'LOAD_DATA_FROM_API',
              payload: {
                lists,
                items,
                categories: apiCategories,
                userPreferences: {
                  currency: user_preferences.currency || state.currency, // API can override currency if set by user
                  isPremium: finalIsPremium,
                }
              }
            });
            console.log(`AppProvider (APIFetch): Successfully fetched API data for user ${state.userId}. Premium: ${finalIsPremium}`);
          } else {
            console.error("AppProvider (APIFetch): API data fetch failed:", apiResponse?.message);
            dispatch({ type: 'SET_APP_LOADING', payload: false }); // Set loading false on failure
          }
        } catch (error) {
          console.error("AppProvider (APIFetch): Exception during API data fetch:", error);
          dispatch({ type: 'SET_APP_LOADING', payload: false }); // Set loading false on exception
        }
      } else if (state.isLoading && (!state.userId || state.userId.startsWith('anon_'))) {
        // If app is loading but user is anonymous or null, implies initial local load is finishing.
        dispatch({ type: 'SET_APP_LOADING', payload: false });
      }
    };
    
    // Only run this if the initial data load process is marked complete
    if (state.isInitialDataLoaded) {
        fetchApiDataForUser();
    }

  }, [state.userId, state.isLoading, state.isInitialDataLoaded, dispatch, state.currency, state.isPremium]);


  const formatCurrency = useCallback((amount: number) => {
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: state.currency.code,
      }).format(amount);
    } catch (error) {
      console.warn("Currency formatting error for code:", state.currency.code, error);
      return `${state.currency.symbol || '$'}${amount.toFixed(2)}`;
    }
  }, [state.currency]);

  // Combined loading state for consumers
  const combinedIsLoading = state.isLoading || authIsLoading;

  return (
    <AppContext.Provider value={{ state, dispatch, formatCurrency, isLoading: combinedIsLoading }}>
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
