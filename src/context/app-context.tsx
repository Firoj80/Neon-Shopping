// src/context/app-context.tsx
"use client";

import React, { createContext, useContext, useReducer, useEffect, useState, useCallback, type ReactNode } from 'react';
import { format, startOfDay, isSameDay } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { getUserCurrency, type Currency } from '@/services/currency';
import { fetchFromApi } from '@/lib/api'; // Ensure this path is correct

const LOCAL_STORAGE_KEY = 'neonShoppingState_v3'; // Updated key for new structure
export const FREEMIUM_LIST_LIMIT = 3;
export const FREEMIUM_CATEGORY_LIMIT = 5; 

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'uncategorized', name: 'Uncategorized', userId: null }, // Global default
  { id: 'default-electronics', name: 'Electronics', userId: null },
  { id: 'default-grocery', name: 'Grocery', userId: null },
  { id: 'default-home', name: 'Home Appliances', userId: null },
  { id: 'default-health', name: 'Health', userId: null },
  { id: 'default-fashion', name: 'Fashion', userId: null },
];


export interface ShoppingListItem {
  id: string;
  listId: string;
  userId: string; 
  name: string;
  quantity: number;
  price: number;
  category: string; // Category ID
  checked: boolean;
  dateAdded: number; // Milliseconds timestamp
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
  defaultCategory: string; // Category ID
}

interface AppState {
  userId: string | null; 
  apiBaseUrl: string;
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
  isLoading: boolean;
}

const defaultCurrency: Currency = { code: 'USD', symbol: '$', name: 'US Dollar' };
const defaultThemeId = 'cyberpunk-cyan'; 

const initialState: AppState = {
  userId: null,
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || '/neon/api', // Ensure this points to your PHP API
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
  | { type: 'LOAD_STATE'; payload: Partial<AppState> }
  | { type: 'LOAD_STATE_FROM_API'; payload: { userId: string; apiBaseUrl: string } }
  | { type: 'SET_USER_ID'; payload: string | null }
  | { type: 'SET_THEME'; payload: string }
  | { type: 'SET_CURRENCY'; payload: Currency }
  | { type: 'ADD_LIST'; payload: List }
  | { type: 'UPDATE_LIST'; payload: List }
  | { type: 'DELETE_LIST'; payload: string } 
  | { type: 'SELECT_LIST'; payload: string | null } 
  | { type: 'ADD_SHOPPING_ITEM'; payload: Omit<ShoppingListItem, 'id' | 'dateAdded' | 'checked'> }
  | { type: 'UPDATE_SHOPPING_ITEM'; payload: ShoppingListItem }
  | { type: 'REMOVE_SHOPPING_ITEM'; payload: string } 
  | { type: 'TOGGLE_SHOPPING_ITEM'; payload: string } 
  | { type: 'ADD_CATEGORY'; payload: Omit<Category, 'id'> } 
  | { type: 'UPDATE_CATEGORY'; payload: Category }
  | { type: 'REMOVE_CATEGORY'; payload: { categoryId: string; reassignToId?: string } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_PREMIUM_STATUS'; payload: boolean }
  | { type: 'RESET_STATE_FOR_LOGOUT' }; 

function appReducer(state: AppState, action: Action): AppState {
  let newState = { ...state };
  switch (action.type) {
    case 'LOAD_STATE':
      newState = { ...state, ...action.payload, isLoading: false };
      if (action.payload.categories) {
          const uniqueCategories = new Map<string, Category>();
          DEFAULT_CATEGORIES.forEach(cat => uniqueCategories.set(cat.id, cat));
          action.payload.categories.forEach(cat => uniqueCategories.set(cat.id, cat));
          newState.categories = Array.from(uniqueCategories.values());
      } else if (!state.categories || state.categories.length === 0) { // Ensure defaults if no categories loaded
          newState.categories = [...DEFAULT_CATEGORIES];
      }
      break;
    case 'LOAD_STATE_FROM_API':
      newState = { ...state, userId: action.payload.userId, apiBaseUrl: action.payload.apiBaseUrl, isLoading: true };
      break;
    case 'SET_USER_ID':
      newState = { ...state, userId: action.payload };
      if (!action.payload) { 
        newState.lists = [];
        newState.shoppingListItems = [];
        newState.selectedListId = null;
        newState.categories = [...DEFAULT_CATEGORIES]; // Reset to defaults on logout
      }
      break;
    case 'SET_THEME':
      newState = { ...state, theme: action.payload };
      break;
    case 'SET_CURRENCY':
      newState = { ...state, currency: action.payload };
      break;
    case 'ADD_LIST':
      if (!newState.userId) {
          console.error("Cannot add list: User not logged in.");
          return state;
      }
      const userListsCount = state.lists.filter(l => l.userId === newState.userId).length;
      if (!state.isPremium && userListsCount >= FREEMIUM_LIST_LIMIT) {
        console.warn("Freemium list limit reached.");
        return state; 
      }
      const newListWithId: List = { ...action.payload, id: action.payload.id || uuidv4(), userId: newState.userId };
      newState.lists = [...state.lists, newListWithId];
      if (state.lists.filter(l => l.userId === newState.userId).length === 0 || state.lists.length === 0 && !state.selectedListId) {
        newState.selectedListId = newListWithId.id;
      }
      break;
    case 'UPDATE_LIST':
      if (!newState.userId) return state;
      newState.lists = state.lists.map(list =>
        list.id === action.payload.id && list.userId === newState.userId ? { ...action.payload, userId: newState.userId } : list
      );
      break;
    case 'DELETE_LIST':
      const listToDelete = state.lists.find(l => l.id === action.payload);
      if (!listToDelete || listToDelete.userId !== newState.userId) return state; 

      newState.lists = state.lists.filter(list => list.id !== action.payload);
      newState.shoppingListItems = state.shoppingListItems.filter(item => item.listId !== action.payload);
      if (state.selectedListId === action.payload) {
        const userLists = newState.lists.filter(l => l.userId === newState.userId);
        newState.selectedListId = userLists.length > 0 ? userLists[0].id : null;
      }
      break;
    case 'SELECT_LIST':
      const listToSelect = state.lists.find(l => l.id === action.payload);
      if (action.payload !== null && (!listToSelect || listToSelect.userId !== newState.userId)) {
          console.warn("Attempted to select a list not belonging to the current user or list not found.");
          return state; 
      }
      newState.selectedListId = action.payload;
      break;
    case 'ADD_SHOPPING_ITEM': {
      if (!action.payload.listId || !newState.userId) { 
        console.error("Attempted to add item without listId or active userId");
        return state;
      }
      const owningList = state.lists.find(l => l.id === action.payload.listId);
      if (!owningList || owningList.userId !== newState.userId) {
          console.error("Attempted to add item to a list not owned by the current user.");
          return state;
      }
      const newItem: ShoppingListItem = {
        id: uuidv4(),
        ...action.payload,
        userId: newState.userId, 
        price: action.payload.price ?? 0,
        checked: false,
        dateAdded: Date.now(),
      };
      newState.shoppingListItems = [...state.shoppingListItems, newItem];
      break;
    }
    case 'UPDATE_SHOPPING_ITEM':
      if (!newState.userId) return state;
      const itemToUpdate = state.shoppingListItems.find(item => item.id === action.payload.id);
      if(!itemToUpdate || itemToUpdate.userId !== newState.userId) return state; 

      newState.shoppingListItems = state.shoppingListItems.map(item =>
        item.id === action.payload.id ? { ...action.payload, price: action.payload.price ?? 0, userId: newState.userId } : item
      );
      break;
    case 'REMOVE_SHOPPING_ITEM':
      const itemToRemove = state.shoppingListItems.find(item => item.id === action.payload);
      if(!itemToRemove || itemToRemove.userId !== newState.userId) return state; 

      newState.shoppingListItems = state.shoppingListItems.filter(item => item.id !== action.payload);
      break;
    case 'TOGGLE_SHOPPING_ITEM':
      const itemToToggle = state.shoppingListItems.find(item => item.id === action.payload);
      if(!itemToToggle || itemToToggle.userId !== newState.userId) return state; 

      newState.shoppingListItems = state.shoppingListItems.map(item =>
        item.id === action.payload ? { ...item, checked: !item.checked, dateAdded: Date.now() } : item
      );
      break;
    case 'ADD_CATEGORY':
      if (!newState.userId) {
          console.error("Cannot add category: User not logged in.");
          return state;
      }
      const userCategoriesCount = state.categories.filter(c => c.userId === newState.userId).length;
      if (!state.isPremium && userCategoriesCount >= FREEMIUM_CATEGORY_LIMIT) {
          console.warn("Freemium category limit reached for custom categories.");
          return state;
      }
      const newCat: Category = {
        id: uuidv4(),
        name: action.payload.name,
        userId: newState.userId, 
      };
      newState.categories = [...state.categories, newCat];
      break;
    case 'UPDATE_CATEGORY':
      const categoryToUpdate = state.categories.find(c => c.id === action.payload.id);
      if (!categoryToUpdate) return state; 

      if (categoryToUpdate.userId === null && !state.isPremium) {
          console.warn("Freemium users cannot edit default categories.");
          return state;
      }
      if (categoryToUpdate.userId !== null && categoryToUpdate.userId !== newState.userId) {
          console.warn("Attempt to edit category not owned by user.");
          return state;
      }
      newState.categories = state.categories.map(cat =>
        cat.id === action.payload.id ? { ...action.payload, userId: categoryToUpdate.userId } : cat
      );
      break;
    case 'REMOVE_CATEGORY':
      const categoryToRemove = state.categories.find(c => c.id === action.payload.categoryId);
      if (!categoryToRemove) return state;

      if (categoryToRemove.userId === null && !state.isPremium) {
          console.warn("Freemium users cannot delete default categories.");
          return state;
      }
      if (categoryToRemove.id === 'uncategorized') {
           console.warn("'Uncategorized' category cannot be deleted.");
           return state; 
      }
      if (categoryToRemove.userId !== null && categoryToRemove.userId !== newState.userId) {
          console.warn("Attempt to delete category not owned by user.");
          return state;
      }

      newState.categories = state.categories.filter(cat => cat.id !== action.payload.categoryId);
      if (newState.userId) { // Ensure userId exists before filtering/mapping
        newState.shoppingListItems = state.shoppingListItems.map(item =>
          item.category === action.payload.categoryId && item.userId === newState.userId
          ? { ...item, category: action.payload.reassignToId || 'uncategorized' }
          : item
        );
        newState.lists = state.lists.map(list =>
          list.defaultCategory === action.payload.categoryId && list.userId === newState.userId
          ? { ...list, defaultCategory: action.payload.reassignToId || 'uncategorized' }
          : item
        );
      }
      break;
    case 'SET_LOADING':
      newState = { ...state, isLoading: action.payload };
      break;
    case 'SET_PREMIUM_STATUS':
      newState = { ...state, isPremium: action.payload };
      break;
    case 'RESET_STATE_FOR_LOGOUT':
      newState = {
        ...initialState, 
        userId: null, 
        apiBaseUrl: state.apiBaseUrl, 
        theme: state.theme,          
        currency: state.currency,       
        categories: [...DEFAULT_CATEGORIES], 
        lists: [],
        shoppingListItems: [],
        selectedListId: null,
        isPremium: false,
        isLoading: false, 
      };
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`${LOCAL_STORAGE_KEY}_${state.userId}`); // Remove specific user's data
        localStorage.removeItem('user_id'); // Remove the generic user_id for anonymous/logged-out state
      }
      break;
    default:
      newState = state;
  }

  // Persist state to localStorage if a user ID is present
  if (newState.userId && typeof window !== 'undefined') {
    try {
      const stateToSave = {
        ...newState,
        isLoading: undefined, 
      };
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_${newState.userId}`, JSON.stringify(stateToSave));
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
    const loadInitialData = async () => {
        if(isInitialDataLoaded || state.userId) return; // Prevent re-running if already loaded or user identified by Auth

        dispatch({ type: 'SET_LOADING', payload: true });
        console.log("AppProvider: Loading initial data (anonymous or from localStorage)...");
        let userIdFromStorage = localStorage.getItem('user_id'); // This is the auth user ID
        let localStateKey = LOCAL_STORAGE_KEY; // Default key for potentially anonymous data

        let loadedState: Partial<AppState> = {};

        if (userIdFromStorage) {
            // User was previously logged in, try to load their specific data
            console.log("AppProvider: Found existing user ID in localStorage:", userIdFromStorage);
            localStateKey = `${LOCAL_STORAGE_KEY}_${userIdFromStorage}`;
            loadedState.userId = userIdFromStorage; // Pre-fill userId for state loading
        } else {
            // No logged-in user ID found, check for anonymous data or generate anonymous ID
            const anonymousUserId = localStorage.getItem('anonymous_user_id_neon_shopping') || `anon_${uuidv4()}`;
            if (!localStorage.getItem('anonymous_user_id_neon_shopping')) {
                localStorage.setItem('anonymous_user_id_neon_shopping', anonymousUserId);
            }
            localStateKey = `${LOCAL_STORAGE_KEY}_${anonymousUserId}`;
            loadedState.userId = anonymousUserId; // This will be used if AuthProvider doesn't set a real one
            console.log("AppProvider: No logged-in user, using/generating anonymous ID:", anonymousUserId);
        }

        const savedStateRaw = localStorage.getItem(localStateKey);
        if (savedStateRaw) {
            try {
                const parsedState = JSON.parse(savedStateRaw);
                loadedState = { ...loadedState, ...parsedState }; // Merge with userId already set
            } catch (e) {
                console.error(`Failed to parse saved state from key ${localStateKey}, using defaults:`, e);
            }
        }
        
        // Auto-detect currency if not already set in loaded state
        if (!loadedState.currency || loadedState.currency.code === defaultCurrency.code) {
            try {
                const detectedCurrency = await getUserCurrency();
                loadedState.currency = detectedCurrency || defaultCurrency;
                if(detectedCurrency) console.log("AppProvider: Currency auto-detected:", detectedCurrency.code);
            } catch (e) {
                console.error("AppProvider: Currency auto-detection failed:", e);
                loadedState.currency = defaultCurrency;
            }
        }

        // Merge categories: defaults + user-specific
        const finalCategories = new Map<string, Category>();
        DEFAULT_CATEGORIES.forEach(cat => finalCategories.set(cat.id, cat));
        (loadedState.categories || []).forEach(cat => finalCategories.set(cat.id, cat));
        loadedState.categories = Array.from(finalCategories.values());

        dispatch({ type: 'LOAD_STATE', payload: loadedState });
        setIsInitialDataLoaded(true);
        dispatch({ type: 'SET_LOADING', payload: false });
        console.log("AppProvider: Initial data load finished. Current user ID in context:", loadedState.userId);
    };
    
    loadInitialData();

  }, [isInitialDataLoaded, state.userId]); // Re-run if state.userId changes from null to something by AuthProvider

  useEffect(() => {
    const fetchApiDataForUser = async () => {
      if (state.userId && !state.userId.startsWith('anon_') && isInitialDataLoaded) { 
        dispatch({ type: 'SET_LOADING', payload: true });
        console.log(`AppProvider: Fetching API data for user ${state.userId}...`);
        try {
          // This endpoint should now be protected and use the session cookie
          const apiResponse = await fetchFromApi(`data/index.php`, { method: 'GET' });
          
          if (apiResponse.success && apiResponse.data) {
            const { lists = [], items = [], categories: apiCategories = [], user_preferences = {} } = apiResponse.data;
            
            const finalCategoriesMap = new Map<string, Category>();
            DEFAULT_CATEGORIES.forEach(cat => finalCategoriesMap.set(cat.id, cat));
            (apiCategories as Category[]).forEach(cat => finalCategoriesMap.set(cat.id, cat));

            dispatch({
              type: 'LOAD_STATE',
              payload: {
                lists,
                shoppingListItems: items,
                categories: Array.from(finalCategoriesMap.values()),
                selectedListId: lists.length > 0 && lists.find((l:List) => l.userId === state.userId) ? lists.find((l:List) => l.userId === state.userId).id : (lists.length > 0 ? lists[0].id : null) ,
                currency: user_preferences.currency || state.currency,
                isPremium: user_preferences.is_premium !== undefined ? user_preferences.is_premium : state.isPremium,
              },
            });
          } else {
            console.error("Failed to fetch data from API for authenticated user:", apiResponse.message);
            // Fallback to local data for this user if API fails, or clear if necessary
            const localUserKey = `${LOCAL_STORAGE_KEY}_${state.userId}`;
            const savedStateRaw = localStorage.getItem(localUserKey);
            if (savedStateRaw) {
                try {
                    const parsedState = JSON.parse(savedStateRaw);
                    dispatch({ type: 'LOAD_STATE', payload: parsedState });
                } catch (e) {
                     dispatch({ type: 'LOAD_STATE', payload: { lists: [], shoppingListItems: [], selectedListId: null, categories: [...DEFAULT_CATEGORIES] } });
                }
            } else {
                 dispatch({ type: 'LOAD_STATE', payload: { lists: [], shoppingListItems: [], selectedListId: null, categories: [...DEFAULT_CATEGORIES] } });
            }
          }
        } catch (error) {
          console.error("Error fetching API data for authenticated user:", error);
           dispatch({ type: 'LOAD_STATE', payload: { lists: [], shoppingListItems: [], selectedListId: null, categories: [...DEFAULT_CATEGORIES] } });
        } finally {
          dispatch({ type: 'SET_LOADING', payload: false });
          console.log("AppProvider: API data fetch finished for user", state.userId);
        }
      }
    };

    if (state.userId && !state.userId.startsWith('anon_') && isInitialDataLoaded) {
        fetchApiDataForUser();
    }
  }, [state.userId, state.apiBaseUrl, isInitialDataLoaded]); 


  const formatCurrency = useCallback((amount: number) => {
    try {
      return new Intl.NumberFormat(undefined, { 
        style: 'currency',
        currency: state.currency.code,
      }).format(amount);
    } catch (error) {
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
