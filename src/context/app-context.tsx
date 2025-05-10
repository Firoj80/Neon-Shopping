
"use client";

import React, { createContext, useContext, useReducer, useEffect, useState, useCallback, type ReactNode } from 'react';
import { format, startOfDay, isSameDay } from 'date-fns';
import { themes, defaultThemeId } from '@/config/themes';
import { v4 as uuidv4 } from 'uuid';
import { getUserCurrency, type Currency, defaultCurrency } from '@/services/currency';
import { fetchFromApi } from '@/lib/api'; // For fetching data for authenticated users
import { useAuth } from './auth-context'; // Import useAuth

const LOCAL_STORAGE_KEY_PREFIX = 'neonShoppingState_anon_'; // Prefix for anonymous user data
export const FREEMIUM_LIST_LIMIT = 3;

// --- Types ---
export interface ShoppingListItem {
  id: string;
  listId: string;
  userId: string; // This will be the app_user_id for anon, or actual user_id for logged-in
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
  budgetLimit: number;
  defaultCategory?: string; 
}

export interface Category {
  id: string;
  userId?: string; // User-specific if not default, or app_user_id for anon custom categories
  name: string;
  isDefault?: boolean; // Flag to indicate if it's a predefined default category
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
  userId: string | null; // Can be app_user_id (for anon) or actual user_id
  currency: Currency;
  theme: string;
  lists: List[];
  selectedListId: string | null;
  shoppingListItems: ShoppingListItem[];
  categories: Category[];
  isPremium: boolean;
  isInitialDataLoaded: boolean;
}

const initialState: AppState = {
  userId: null, 
  currency: defaultCurrency,
  theme: defaultThemeId,
  lists: [],
  selectedListId: null,
  shoppingListItems: [],
  categories: DEFAULT_CATEGORIES.map(cat => ({ ...cat })), // Ensure defaults are copied
  isPremium: false, 
  isInitialDataLoaded: false,
};

// --- Actions ---
export type Action =
  | { type: 'LOAD_STATE'; payload: Partial<AppState> } // For loading from localStorage (anon) or initial setup
  | { type: 'LOAD_STATE_FROM_API'; payload: Partial<AppState> } // For loading data for authenticated user
  | { type: 'SET_USER_ID'; payload: string | null } // Sets the current operational userId (anon or auth)
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
  | { type: 'SET_INITIAL_DATA_LOADED'; payload: boolean }
  | { type: 'RESET_STATE_FOR_NEW_USER' }; // New action to reset state


// --- Reducer ---
function appReducer(state: AppState, action: Action): AppState {
  let newState = { ...state };

  switch (action.type) {
    case 'LOAD_STATE':
    case 'LOAD_STATE_FROM_API':
      console.log(`Reducer: ${action.type}`, action.payload);
      newState = {
        ...state, // Keep existing state like theme if not in payload
        ...action.payload, // Override with new data
        userId: action.payload.userId || state.userId, // Ensure userId is maintained or set
        currency: action.payload.currency || state.currency || defaultCurrency,
        theme: action.payload.theme || state.theme || defaultThemeId,
        lists: action.payload.lists || [],
        selectedListId: action.payload.selectedListId || (action.payload.lists && action.payload.lists.length > 0 ? action.payload.lists[0].id : null),
        shoppingListItems: action.payload.shoppingListItems || [],
        // Ensure categories are correctly merged or defaulted
        categories: action.payload.categories && action.payload.categories.length > 0 
                    ? action.payload.categories 
                    : DEFAULT_CATEGORIES.map(cat => ({...cat, userId: action.payload.userId || undefined })),
        isPremium: action.payload.isPremium !== undefined ? action.payload.isPremium : state.isPremium,
        isInitialDataLoaded: true, // Mark as loaded once state is processed
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
        alert(`Free users can only create up to ${FREEMIUM_LIST_LIMIT} lists. Upgrade to premium for unlimited lists.`);
        return state; 
      }
      newState = { ...state, lists: [...state.lists, action.payload] };
      if (state.lists.length === 0) {
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
      if (!state.isPremium) {
         alert("Creating custom categories is a premium feature.");
         return state;
      }
      const categoryToAdd = { ...action.payload, userId: state.userId, isDefault: false };
      if (!state.categories.find(cat => cat.userId === state.userId && cat.name.toLowerCase() === categoryToAdd.name.toLowerCase())) {
        newState = { ...state, categories: [...state.categories, categoryToAdd] };
      } else {
        alert(`Category "${categoryToAdd.name}" already exists.`);
      }
      break;
    case 'UPDATE_CATEGORY':
       if (!state.userId) {
        console.error("Cannot update category: User ID is missing.");
        return state;
      }
      if (!state.isPremium) {
         alert("Editing categories is a premium feature.");
         return state;
      }
      const categoryToUpdate = state.categories.find(cat => cat.id === action.payload.id);
      if (categoryToUpdate?.isDefault && !state.isPremium) {
          alert("Default categories cannot be edited by free users.");
          return state;
      }
      newState = {
        ...state,
        categories: state.categories.map(cat =>
          cat.id === action.payload.id && cat.userId === state.userId ? { ...action.payload, userId: state.userId, isDefault: cat.isDefault } : cat
        ),
      };
      break;
    case 'DELETE_CATEGORY':
      const categoryIdToDelete = action.payload;
      if (!state.userId) {
        console.error("Cannot delete category: User ID is missing.");
        return state;
      }
      const catToDelete = state.categories.find(c => c.id === categoryIdToDelete && c.userId === state.userId);
      if (!catToDelete) return state; // Category not found or not user's

      if (catToDelete.isDefault && !state.isPremium) {
        alert("Default categories cannot be deleted by free users.");
        return state;
      }
      if (!catToDelete.isDefault && !state.isPremium) { // Non-default can only be deleted by premium
          alert("Deleting custom categories is a premium feature.");
          return state;
      }
      
      const uncategorizedUserCategory = state.categories.find(c => c.userId === state.userId && (c.id === 'uncategorized' || c.name.toLowerCase() === 'uncategorized')) || DEFAULT_CATEGORIES.find(c => c.id === 'uncategorized');
      const targetCategoryId = uncategorizedUserCategory!.id;

      newState = {
        ...state,
        categories: state.categories.filter(cat => !(cat.id === categoryIdToDelete && cat.userId === state.userId)),
        shoppingListItems: state.shoppingListItems.map(item =>
          item.userId === state.userId && item.category === categoryIdToDelete
            ? { ...item, category: targetCategoryId }
            : item
        ),
      };
      newState.lists = newState.lists.map(list =>
        list.userId === state.userId && list.defaultCategory === categoryIdToDelete
        ? { ...list, defaultCategory: targetCategoryId } 
        : list
      );
      break;
    case 'SET_PREMIUM_STATUS':
      newState = { ...state, isPremium: action.payload };
      break;
    case 'SET_INITIAL_DATA_LOADED': // This action might be redundant if LOAD_STATE handles it
      newState = { ...state, isInitialDataLoaded: action.payload };
      break;
    case 'RESET_STATE_FOR_NEW_USER':
      console.log("Reducer: RESET_STATE_FOR_NEW_USER");
      // Generate a new anonymous ID
      const newAnonUserId = `anon_${uuidv4()}`;
      localStorage.setItem('app_user_id', newAnonUserId); // Persist new anon ID

      newState = {
        ...initialState, // Reset to initial state
        userId: newAnonUserId, // Set the new anonymous user ID
        currency: state.currency, // Keep potentially detected currency
        theme: state.theme, // Keep current theme
        isInitialDataLoaded: true, // Mark as loaded
      };
      // Clear data associated with the old anonymous user from localStorage
      // This assumes you use a dynamic key based on userId or a single key for all anon data
      // If using a single key:
      localStorage.removeItem(`${LOCAL_STORAGE_KEY_PREFIX}${state.userId}`); 
      // Or, if using a generic key for anon users that gets overwritten:
      // localStorage.removeItem(LOCAL_STORAGE_ANON_USER_DATA_KEY); // A hypothetical key
      break;
    default:
      // newState = state; // Removed to avoid ESLint error
      break;
  }

  // Persist state to localStorage for relevant actions, specific to the current userId
  if (action.type !== 'LOAD_STATE' && action.type !== 'LOAD_STATE_FROM_API' && action.type !== 'SET_INITIAL_DATA_LOADED' && typeof window !== 'undefined' && newState.userId && !newState.userId.startsWith('anon_')) {
    // Only save to general LOCAL_STORAGE_KEY if it's NOT an anonymous user's data.
    // Authenticated user data is saved under a generic key, assuming backend sync is the source of truth.
    // localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + "auth_user_data", JSON.stringify(newState));
  } else if (newState.userId && newState.userId.startsWith('anon_') && typeof window !== 'undefined') {
     // Save anonymous user data under a key specific to their anonymous ID
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${newState.userId}`, JSON.stringify(newState));
  }
  
  return newState;
}


interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  isLoading: boolean; 
  loadDataForAuthenticatedUser: (userId: string, token: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [isLoading, setIsLoading] = useState(true);
  const { user: authUser, token, isLoading: authIsLoading, isAuthenticated } = useAuth(); // Get auth context

  const loadDataForAuthenticatedUser = useCallback(async (userId: string, authToken: string) => {
    console.log("AppProvider: Attempting to load data for authenticated user:", userId);
    setIsLoading(true);
    try {
      // Example: Fetch lists, items, categories for the authenticated user
      // Adjust API endpoints and data structure as per your backend
      const [listsData, itemsData, categoriesData, userPrefsData] = await Promise.all([
        fetchFromApi(`/users/${userId}/lists`, authToken),
        fetchFromApi(`/users/${userId}/items`, authToken),
        fetchFromApi(`/users/${userId}/categories`, authToken),
        fetchFromApi(`/users/${userId}/preferences`, authToken), // e.g., currency, theme, premium_status
      ]);

      dispatch({
        type: 'LOAD_STATE_FROM_API',
        payload: {
          userId: userId,
          lists: listsData.lists || [],
          shoppingListItems: itemsData.items || [],
          categories: categoriesData.categories && categoriesData.categories.length > 0 
                      ? categoriesData.categories 
                      : DEFAULT_CATEGORIES.map(cat => ({...cat, userId: userId})),
          selectedListId: listsData.lists && listsData.lists.length > 0 ? listsData.lists[0].id : null,
          currency: userPrefsData.currency || state.currency || defaultCurrency, // Prioritize API, then current, then default
          theme: userPrefsData.theme || state.theme || defaultThemeId,
          isPremium: userPrefsData.is_premium || false,
          isInitialDataLoaded: true,
        },
      });
      console.log("AppProvider: Data loaded for authenticated user:", userId);
    } catch (error) {
      console.error("AppProvider: Failed to load data for authenticated user:", error);
      // Fallback to anonymous state or handle error appropriately
      // Potentially dispatch RESET_STATE_FOR_NEW_USER or a specific error state
      dispatch({ type: 'SET_INITIAL_DATA_LOADED', payload: true }); // Still mark as loaded to avoid blocking UI
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, state.currency, state.theme]); // Added dependencies

  useEffect(() => {
    const loadInitialData = async () => {
      console.log("AppProvider: Loading initial data...");
      setIsLoading(true);

      if (isAuthenticated && authUser && token) {
        // Authenticated user: data will be loaded by loadDataForAuthenticatedUser
        // This useEffect in AppProvider might not need to do much more for auth users
        // as loadDataForAuthenticatedUser is called from AuthProvider or page components
        console.log("AppProvider: Authenticated user detected. Data load will be triggered by auth flow.");
        // We can still set the userId here for consistency before API data arrives
        dispatch({ type: 'SET_USER_ID', payload: authUser.id });
        // It's important that loadDataForAuthenticatedUser is called elsewhere (e.g. after login, or on initial auth check)
        // For now, let's assume it is, and just set initial loaded to true after a small delay if no data comes.
        // This path needs careful orchestration with AuthProvider.
        // If loadDataForAuthenticatedUser isn't called, we might get stuck here.
        // A simple approach:
        if(!state.isInitialDataLoaded){ // If API data hasn't loaded it yet
             await loadDataForAuthenticatedUser(authUser.id, token);
        }
         setIsLoading(false); // Auth loading is separate, this is for app data.

      } else {
        // Anonymous user
        console.log("AppProvider: No authenticated user, setting up for anonymous user.");
        let anonUserId = localStorage.getItem('app_user_id');
        if (!anonUserId) {
          anonUserId = `anon_${uuidv4()}`;
          localStorage.setItem('app_user_id', anonUserId);
          console.log("AppProvider: Generated new anonymous user ID:", anonUserId);
        } else {
          console.log("AppProvider: Found existing anonymous user ID:", anonUserId);
        }

        let loadedStateFromStorage: Partial<AppState> = {};
        const anonymousUserStorageKey = `${LOCAL_STORAGE_KEY_PREFIX}${anonUserId}`;
        try {
          const savedStateRaw = localStorage.getItem(anonymousUserStorageKey);
          if (savedStateRaw) {
            loadedStateFromStorage = JSON.parse(savedStateRaw);
            console.log("AppProvider: Loaded state from localStorage for anonymous user:", anonUserId);
          } else {
            console.log("AppProvider: No saved state in localStorage for anonymous user:", anonUserId);
          }
        } catch (error) {
          console.error("AppProvider: Failed to parse state from localStorage for anonymous user:", error);
        }
        
        let finalCurrency = loadedStateFromStorage.currency || defaultCurrency;
        if (!loadedStateFromStorage.currency) {
          try {
            const detectedCurrency = await getUserCurrency();
            finalCurrency = detectedCurrency || defaultCurrency;
            console.log("AppProvider: Currency auto-detected for anonymous user:", finalCurrency.code);
          } catch (error) {
            console.error("AppProvider: Currency auto-detection failed for anonymous user:", error);
          }
        }
        
        const categoriesForAnon = (loadedStateFromStorage.categories && loadedStateFromStorage.categories.length > 0)
          ? loadedStateFromStorage.categories
          : DEFAULT_CATEGORIES.map(cat => ({ ...cat, userId: anonUserId }));

        dispatch({
          type: 'LOAD_STATE',
          payload: {
            ...initialState, // Start with a clean slate for anon user structure
            ...loadedStateFromStorage, // Override with any saved anon data
            userId: anonUserId,
            currency: finalCurrency,
            categories: categoriesForAnon,
            isInitialDataLoaded: true,
          },
        });
        setIsLoading(false);
        console.log("AppProvider: Initial data processing finished for anonymous user. Current user ID in context:", anonUserId);
      }
    };

    // We only want to run this complex initial load logic once, or if the auth state fundamentally changes.
    // authIsLoading ensures we wait for auth state to settle.
    // state.isInitialDataLoaded prevents re-running if data is already loaded.
    if (!authIsLoading && !state.isInitialDataLoaded) {
       loadInitialData();
    } else if (!authIsLoading && isAuthenticated && authUser && state.userId !== authUser.id) {
      // This case handles if user logs in *after* anonymous state was set up.
      // We need to switch to authenticated user's data.
      console.log("AppProvider: User authenticated, but AppContext has different/anon ID. Reloading data for auth user.");
      loadDataForAuthenticatedUser(authUser.id, token!); // token should be available if isAuthenticated
    } else if (!authIsLoading && !isAuthenticated && state.userId && !state.userId.startsWith('anon_')) {
        // This case handles if user logs out. Reset to new anonymous state.
        console.log("AppProvider: User logged out. Resetting to new anonymous state.");
        dispatch({ type: 'RESET_STATE_FOR_NEW_USER' });
        setIsLoading(false); // Reset loading after state reset
    } else if (!authIsLoading && state.isInitialDataLoaded) {
        // Auth state is settled, app data is loaded. No further action needed here for initial load.
        setIsLoading(false); // Ensure loading is false
    }

  }, [authIsLoading, isAuthenticated, authUser, token, state.isInitialDataLoaded, state.userId, dispatch, loadDataForAuthenticatedUser]);


  const contextValue = {
    state, 
    dispatch,
    isLoading: isLoading || authIsLoading, // Combine loading states
    loadDataForAuthenticatedUser,
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
