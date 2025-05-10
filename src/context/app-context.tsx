
"use client";

import React, { createContext, useContext, useReducer, useEffect, useState, useCallback, type ReactNode } from 'react';
import { format, startOfDay, isSameDay } from 'date-fns';
import { themes, defaultThemeId } from '@/config/themes';
import { v4 as uuidv4 } from 'uuid';
import { getUserCurrency, type Currency, defaultCurrency } from '@/services/currency';

const LOCAL_STORAGE_KEY = 'neonShoppingState_vLocal_UserSpecific';
export const FREEMIUM_LIST_LIMIT = 3;

// --- Types ---
export interface ShoppingListItem {
  id: string;
  listId: string;
  userId: string;
  name: string;
  quantity: number;
  price: number;
  category: string; // Category ID
  checked: boolean;
  dateAdded: number; // Timestamp
}

export interface List {
  id: string;
  userId: string;
  name: string;
  budgetLimit: number | string; // Allow string for input, parse to number
  defaultCategory: string; // Changed to be non-optional, ensure 'uncategorized' is default
}

export interface Category {
  id: string;
  userId?: string; // User specific categories will have this
  name: string;
  isDefault?: boolean; // Indicates if it's a system-provided default category
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'grocery', name: 'Grocery', isDefault: true },
  { id: 'home', name: 'Home Appliances', isDefault: true },
  { id: 'health', name: 'Health', isDefault: true },
  { id: 'electronics', name: 'Electronics', isDefault: true },
  { id: 'fashion', name: 'Fashion', isDefault: true },
  { id: 'sports', name: 'Sports', isDefault: true },
  { id: 'uncategorized', name: 'Uncategorized', isDefault: true },
];


export interface AppState {
  userId: string | null;
  currency: Currency;
  theme: string;
  lists: List[];
  selectedListId: string | null;
  shoppingListItems: ShoppingListItem[];
  categories: Category[];
  isPremium: boolean;
  isInitialDataLoaded: boolean; // Tracks if essential initial data has been loaded
  isLoadingData: boolean; // More specific loading state for data operations
}

const initialState: AppState = {
  userId: null,
  currency: defaultCurrency,
  theme: defaultThemeId,
  lists: [],
  selectedListId: null,
  shoppingListItems: [],
  categories: DEFAULT_CATEGORIES.map(cat => ({ ...cat })), // Start with defaults
  isPremium: false,
  isInitialDataLoaded: false,
  isLoadingData: true, // Initially true, set to false after data load
};

// --- Actions ---
export type Action =
  | { type: 'LOAD_STATE'; payload: Partial<AppState> & { userId: string } } // Ensure userId is part of payload
  | { type: 'SET_USER_ID'; payload: string | null }
  | { type: 'SET_CURRENCY'; payload: Currency }
  | { type: 'SET_THEME'; payload: string }
  | { type: 'ADD_LIST'; payload: List }
  | { type: 'UPDATE_LIST'; payload: List }
  | { type: 'DELETE_LIST'; payload: string }
  | { type: 'SELECT_LIST'; payload: string | null }
  | { type: 'ADD_SHOPPING_ITEM'; payload: ShoppingListItem }
  | { type: 'UPDATE_SHOPPING_ITEM'; payload: ShoppingListItem }
  | { type: 'DELETE_SHOPPING_ITEM'; payload: string }
  | { type: 'TOGGLE_ITEM_CHECKED'; payload: string }
  | { type: 'ADD_CATEGORY'; payload: Category }
  | { type: 'UPDATE_CATEGORY'; payload: Category }
  | { type: 'DELETE_CATEGORY'; payload: string }
  | { type: 'SET_PREMIUM_STATUS'; payload: boolean }
  | { type: 'SET_IS_LOADING_DATA'; payload: boolean }; // Action for the new loading state


// --- Reducer ---
function appReducer(state: AppState, action: Action): AppState {
  let newState = { ...state };

  switch (action.type) {
    case 'LOAD_STATE':
      console.log('Reducer: LOAD_STATE with payload:', action.payload);
      newState = {
        ...state,
        ...action.payload, // Spread payload first
        userId: action.payload.userId, // Explicitly set userId
        currency: action.payload.currency || state.currency,
        theme: action.payload.theme || state.theme,
        lists: action.payload.lists || state.lists,
        selectedListId: action.payload.selectedListId !== undefined ? action.payload.selectedListId : (action.payload.lists && action.payload.lists.length > 0 ? action.payload.lists[0].id : null),
        shoppingListItems: action.payload.shoppingListItems || state.shoppingListItems,
        categories: action.payload.categories && action.payload.categories.length > 0
                    ? action.payload.categories
                    : DEFAULT_CATEGORIES.map(cat => ({...cat, userId: action.payload.userId })),
        isPremium: action.payload.isPremium !== undefined ? action.payload.isPremium : state.isPremium,
        isInitialDataLoaded: true, // Mark that initial data (from localStorage or default) is now loaded
        isLoadingData: false, // Data loading is complete
      };
      break;
    case 'SET_USER_ID':
      newState = { ...state, userId: action.payload };
      break;
    case 'SET_CURRENCY':
      newState = { ...state, currency: action.payload };
      break;
    case 'SET_THEME':
      newState = { ...state, theme: action.payload };
      break;
    case 'ADD_LIST':
      if (!state.userId) {
        console.error("Cannot add list: User ID is missing.");
        return state;
      }
      if (!state.isPremium && state.lists.length >= FREEMIUM_LIST_LIMIT) {
        alert(`Free users can only create up to ${FREEMIUM_LIST_LIMIT} lists.`);
        return state;
      }
      newState = { ...state, lists: [...state.lists, action.payload] };
      if (state.lists.length === 0) { // Auto-select first list if it's the only one
        newState.selectedListId = action.payload.id;
      }
      break;
    case 'UPDATE_LIST':
      newState = {
        ...state,
        lists: state.lists.map(list => list.id === action.payload.id ? action.payload : list),
      };
      break;
    case 'DELETE_LIST':
      const listIdToDelete = action.payload;
      const remainingLists = state.lists.filter(list => list.id !== listIdToDelete);
      let newSelectedListId = state.selectedListId;

      if (state.selectedListId === listIdToDelete) {
        newSelectedListId = remainingLists.length > 0 ? remainingLists[0].id : null;
      }
      newState = {
        ...state,
        lists: remainingLists,
        shoppingListItems: state.shoppingListItems.filter(item => item.listId !== listIdToDelete),
        selectedListId: newSelectedListId,
      };
      break;
    case 'SELECT_LIST':
      newState = { ...state, selectedListId: action.payload };
      break;
    case 'ADD_SHOPPING_ITEM': {
      if (!action.payload.listId || !action.payload.userId) {
        console.error("Attempted to add item without listId or userId", action.payload);
        return state;
      }
      const newItem: ShoppingListItem = { ...action.payload, dateAdded: Date.now() };
      newState = { ...state, shoppingListItems: [...state.shoppingListItems, newItem] };
      break;
    }
    case 'UPDATE_SHOPPING_ITEM':
      newState = {
        ...state,
        shoppingListItems: state.shoppingListItems.map(item =>
          item.id === action.payload.id ? action.payload : item
        ),
      };
      break;
    case 'DELETE_SHOPPING_ITEM':
      newState = {
        ...state,
        shoppingListItems: state.shoppingListItems.filter(item => item.id !== action.payload),
      };
      break;
    case 'TOGGLE_ITEM_CHECKED':
      newState = {
        ...state,
        shoppingListItems: state.shoppingListItems.map(item =>
          item.id === action.payload ? { ...item, checked: !item.checked } : item
        ),
      };
      break;
    case 'ADD_CATEGORY':
       if (!state.userId) {
        console.error("Cannot add category: User ID is missing.");
        return state;
      }
       // Premium check for custom categories
       const userCategories = state.categories.filter(c => c.userId === state.userId && !c.isDefault);
       if (!state.isPremium && userCategories.length >= 2) { // Example: Limit 2 custom categories for free users
           alert("Free users can create up to 2 custom categories. Upgrade to Premium for unlimited categories.");
           return state;
       }
      // Prevent adding category if one with the same name already exists for this user or as default
      if (state.categories.some(cat => cat.name.toLowerCase() === action.payload.name.toLowerCase() && (cat.isDefault || cat.userId === state.userId))) {
        alert(`Category "${action.payload.name}" already exists.`);
        return state;
      }
      const newCategoryWithUser = { ...action.payload, userId: state.userId, isDefault: false };
      newState = { ...state, categories: [...state.categories, newCategoryWithUser] };
      break;
    case 'UPDATE_CATEGORY':
      const categoryToUpdate = state.categories.find(cat => cat.id === action.payload.id);
      if (categoryToUpdate?.isDefault) {
          alert("Default categories cannot be renamed.");
          return state;
      }
      // Prevent renaming to a name that already exists for this user or as default
      if (state.categories.some(cat => cat.id !== action.payload.id && cat.name.toLowerCase() === action.payload.name.toLowerCase() && (cat.isDefault || cat.userId === state.userId))) {
        alert(`Another category named "${action.payload.name}" already exists.`);
        return state;
      }
      newState = {
        ...state,
        categories: state.categories.map(cat =>
          cat.id === action.payload.id ? { ...action.payload, userId: cat.userId, isDefault: cat.isDefault } : cat
        ),
      };
      break;
    case 'DELETE_CATEGORY':
      const categoryToDelete = state.categories.find(cat => cat.id === action.payload);
      if (!categoryToDelete) return state; // Category not found
      if (categoryToDelete.isDefault) {
        alert("Default categories cannot be deleted.");
        return state;
      }
      // If deleting a custom category, reassign items to 'uncategorized'
      const uncategorizedDefault = DEFAULT_CATEGORIES.find(c => c.id === 'uncategorized');
      if (!uncategorizedDefault) {
          console.error("Critical: Uncategorized default category not found.");
          return state; // Should not happen
      }
      newState = {
        ...state,
        categories: state.categories.filter(cat => cat.id !== action.payload),
        shoppingListItems: state.shoppingListItems.map(item =>
          item.category === action.payload ? { ...item, category: uncategorizedDefault.id } : item
        ),
        lists: state.lists.map(list =>
            list.defaultCategory === action.payload ? { ...list, defaultCategory: uncategorizedDefault.id } : list
        )
      };
      break;
    case 'SET_PREMIUM_STATUS':
      newState = { ...state, isPremium: action.payload };
      break;
    case 'SET_IS_LOADING_DATA':
      newState = { ...state, isLoadingData: action.payload };
      break;
    default:
      // Ensure that unhandled actions don't modify state
      return state;
  }

  // Persist state to localStorage after every action (except initial load from storage)
  if (action.type !== 'LOAD_STATE' && typeof window !== 'undefined' && newState.userId) {
    try {
      // Filter out default categories that don't have a userId before saving
      const categoriesToSave = newState.categories.filter(cat => cat.userId === newState.userId || cat.isDefault);
      const stateToSave = { ...newState, categories: categoriesToSave };
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_${newState.userId}`, JSON.stringify(stateToSave));
      console.log('Reducer: State saved for user:', newState.userId);
    } catch (error) {
      console.error("Failed to save state to localStorage:", error);
    }
  }
  
  return newState;
}


interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  isLoading: boolean; // Renamed from isLoadingData for clarity in consuming components
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  // This local isLoading controls the AppProvider's own loading state for initial data setup.
  const [isProviderLoading, setIsProviderLoading] = useState(true);
  // This local state prevents re-running the full data load logic unnecessarily.
  const [isInitialDataSetByProvider, setIsInitialDataSetByProvider] = useState(false);


  useEffect(() => {
    const loadInitialData = async () => {
      console.log("AppProvider: Starting initial data load sequence...");
      setIsProviderLoading(true); // Signal that AppProvider is loading initial data

      try {
        let anonUserId = localStorage.getItem('app_user_id_local'); // Use a generic key for anon ID
        if (!anonUserId) {
          anonUserId = `anon_${uuidv4()}`;
          localStorage.setItem('app_user_id_local', anonUserId);
          console.log("AppProvider: Generated new anonymous user ID:", anonUserId);
        } else {
          console.log("AppProvider: Found existing anonymous user ID:", anonUserId);
        }

        let loadedStateFromStorage: Partial<AppState> = {};
        const userSpecificStorageKey = `${LOCAL_STORAGE_KEY}_${anonUserId}`;
        try {
          const savedStateRaw = localStorage.getItem(userSpecificStorageKey);
          if (savedStateRaw) {
            loadedStateFromStorage = JSON.parse(savedStateRaw);
            console.log(`AppProvider: Loaded state from localStorage for user ${anonUserId}.`);
          } else {
            console.log(`AppProvider: No saved state in localStorage for user ${anonUserId}. Will use defaults.`);
          }
        } catch (error) {
          console.error("AppProvider: Failed to parse state from localStorage:", error);
        }
        
        let finalCurrency = loadedStateFromStorage.currency || defaultCurrency;
        if (!loadedStateFromStorage.currency) {
          try {
            const detectedCurrency = await getUserCurrency(); // This can be slow
            finalCurrency = detectedCurrency || defaultCurrency;
            console.log("AppProvider: Currency auto-detected:", finalCurrency.code);
          } catch (error) {
            console.error("AppProvider: Currency auto-detection failed, using default:", error);
          }
        }
        
        // Combine default categories with user-specific ones from storage, ensuring no duplicates by name for the current user
        const combinedCategories = [...DEFAULT_CATEGORIES.map(c => ({...c, userId: undefined}))]; // Start with defaults (no userId for these)
        if (loadedStateFromStorage.categories) {
            loadedStateFromStorage.categories.forEach(storedCat => {
                if (!storedCat.isDefault && storedCat.userId === anonUserId) { // Only add user's custom categories
                    if (!combinedCategories.some(c => c.name.toLowerCase() === storedCat.name.toLowerCase() && (c.isDefault || c.userId === anonUserId))) {
                        combinedCategories.push(storedCat);
                    }
                }
            });
        }


        // Dispatch LOAD_STATE with all necessary data, including the crucial userId
        dispatch({
          type: 'LOAD_STATE',
          payload: {
            ...initialState, // Base defaults
            ...loadedStateFromStorage, // Overwrite with stored data
            userId: anonUserId, // This is the critical part
            currency: finalCurrency,
            theme: loadedStateFromStorage.theme || defaultThemeId,
            categories: combinedCategories,
            isPremium: loadedStateFromStorage.isPremium || false,
            // isInitialDataLoaded and isLoadingData are set by the LOAD_STATE reducer
          },
        });

        setIsInitialDataSetByProvider(true); // Mark that this effect has run its course
        console.log(`AppProvider: Initial data load sequence finished for user ${anonUserId}.`);

      } catch (error) {
          console.error("AppProvider: Critical error during loadInitialData sequence:", error);
          // If a major error occurs, we might still want to signal loading is done
          // and perhaps dispatch a default state or an error state.
          // For now, just ensure loading stops.
          dispatch({ type: 'SET_IS_LOADING_DATA', payload: false }); 
      } finally {
          setIsProviderLoading(false); // This provider's specific loading is done
          // The isLoadingData in global state is handled by the LOAD_STATE reducer
      }
    };

    if (!isInitialDataSetByProvider && typeof window !== 'undefined') {
       loadInitialData();
    } else if (isInitialDataSetByProvider && isProviderLoading) {
      // This case handles if the effect re-runs after initial set but provider is still loading
      // (should be rare if isInitialDataSetByProvider logic is correct)
      setIsProviderLoading(false);
    }

  }, [isInitialDataSetByProvider, isProviderLoading]); // Effect dependencies


  // The `isLoading` passed to context consumers should reflect the global data loading status
  const contextValue = {
    state, 
    dispatch,
    isLoading: state.isLoadingData || isProviderLoading, // Combine provider loading with global data loading
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};


    