
"use client";
import type React from 'react';
import { createContext, useContext, useReducer, useEffect, useState, useCallback } from 'react';
import type { Currency } from '@/services/currency';
import { getUserCurrency } from '@/services/currency';
import { format } from 'date-fns'; // Import format for date comparison

// --- Types ---
interface BudgetItem {
    limit: number;
    spent: number; // Represents money actually spent (checked items) *today*
    lastSetDate: string | null; // YYYY-MM-DD format for when the limit was last set
}

interface AppState {
    currency: Currency;
    budget: BudgetItem;
    shoppingList: ShoppingListItem[]; // All items, checked or unchecked
}

interface ShoppingListItem {
    id: string;
    name: string;
    quantity: number;
    price: number;
    category: string;
    checked: boolean; // Indicates if the item has been purchased
    dateAdded: number; // Timestamp
}

type Action =
    | { type: 'SET_CURRENCY'; payload: Currency }
    | { type: 'SET_BUDGET_LIMIT'; payload: { limit: number; date: string } } // Include date
    | { type: 'RESET_DAILY_BUDGET' } // New action for daily reset
    | { type: 'ADD_SHOPPING_ITEM'; payload: Omit<ShoppingListItem, 'id' | 'dateAdded'> }
    | { type: 'UPDATE_SHOPPING_ITEM'; payload: ShoppingListItem }
    | { type: 'REMOVE_SHOPPING_ITEM'; payload: string } // id
    | { type: 'TOGGLE_SHOPPING_ITEM'; payload: string } // id
    | { type: 'LOAD_STATE'; payload: Partial<AppState> };

interface AppContextProps {
    state: AppState;
    dispatch: React.Dispatch<Action>;
    formatCurrency: (amount: number) => string;
    isLoading: boolean;
}

// --- Initial State & Reducer ---
const defaultCurrency: Currency = { code: 'USD', symbol: '$', name: 'US Dollar' };
const initialState: AppState = {
    currency: defaultCurrency,
    budget: { limit: 0, spent: 0, lastSetDate: null }, // Initialize lastSetDate
    shoppingList: [],
};

const LOCAL_STORAGE_KEY = 'neonShoppingListState_v2'; // Increment version if schema changes

// Helper to calculate spent amount based on checked items added *today*
const calculateTodaysSpent = (list: ShoppingListItem[]): number => {
     const todayStart = new Date();
     todayStart.setHours(0, 0, 0, 0);
     const todayTimestamp = todayStart.getTime();

    return list
        .filter(item => item.checked && item.dateAdded >= todayTimestamp) // Only include items checked today
        .reduce((total, item) => total + (item.price * item.quantity), 0);
};


function appReducer(state: AppState, action: Action): AppState {
    let newState: AppState;
    const today = format(new Date(), 'yyyy-MM-dd');

    switch (action.type) {
        case 'SET_CURRENCY':
            newState = { ...state, currency: action.payload };
            break;
        case 'SET_BUDGET_LIMIT':
             // When setting limit, also update the date and recalculate today's spent
            newState = {
                ...state,
                budget: {
                    ...state.budget,
                    limit: action.payload.limit,
                    lastSetDate: action.payload.date, // Store the date
                    spent: calculateTodaysSpent(state.shoppingList), // Recalculate spent for today
                }
            };
            break;
         case 'RESET_DAILY_BUDGET':
             // Reset limit to 0, keep spent calculation based on today's items
            newState = {
                ...state,
                budget: {
                     limit: 0, // Reset limit
                     spent: calculateTodaysSpent(state.shoppingList), // Recalculate spent for today
                     lastSetDate: today, // Update date to today
                }
            };
            break;
        case 'ADD_SHOPPING_ITEM': {
            const newItem: ShoppingListItem = {
                ...action.payload,
                id: crypto.randomUUID(),
                dateAdded: Date.now(),
            };
             // Adding an item doesn't change today's *spent* amount unless it's immediately checked (handled by TOGGLE)
            newState = { ...state, shoppingList: [newItem, ...state.shoppingList] };
            break;
        }
         case 'UPDATE_SHOPPING_ITEM': {
             const updatedList = state.shoppingList.map((item) =>
                 item.id === action.payload.id ? action.payload : item
             );
              // Update can change checked status, so recalculate today's spent
             newState = {
                 ...state,
                 shoppingList: updatedList,
                 budget: { ...state.budget, spent: calculateTodaysSpent(updatedList) }
             };
             break;
            }
        case 'REMOVE_SHOPPING_ITEM': {
            const filteredList = state.shoppingList.filter((item) => item.id !== action.payload);
             // Removing an item might change today's spent if it was checked today
            newState = {
                ...state,
                shoppingList: filteredList,
                budget: { ...state.budget, spent: calculateTodaysSpent(filteredList) }
            };
            break;
        }
        case 'TOGGLE_SHOPPING_ITEM': {
            const toggledList = state.shoppingList.map((item) =>
                item.id === action.payload ? { ...item, checked: !item.checked } : item
            );
             // Toggling directly affects today's spent calculation
            newState = {
                ...state,
                shoppingList: toggledList,
                budget: { ...state.budget, spent: calculateTodaysSpent(toggledList) }
            };
            break;
        }
         case 'LOAD_STATE': {
            // Carefully merge loaded state
            const loadedList = action.payload.shoppingList || state.shoppingList;
            const loadedBudget = action.payload.budget;
            const loadedDate = loadedBudget?.lastSetDate;

            let currentLimit = state.budget.limit;
            let currentLastSetDate = state.budget.lastSetDate;

             // If loaded data is from today, use its limit, otherwise reset
             if (loadedDate === today) {
                currentLimit = loadedBudget?.limit ?? 0;
                currentLastSetDate = today;
             } else {
                 // If loaded data is old or missing date, reset the daily budget implicitly
                 currentLimit = 0;
                 currentLastSetDate = today; // Start fresh for today
             }

            newState = {
                currency: action.payload.currency || state.currency,
                budget: {
                    limit: currentLimit,
                    spent: calculateTodaysSpent(loadedList), // Always recalculate spent based on loaded list and *today's* date
                    lastSetDate: currentLastSetDate,
                },
                shoppingList: loadedList,
            };
            break;
         }
        default:
            newState = state;
    }

     // Persist state changes AFTER calculating new state
    if (action.type !== 'LOAD_STATE' && typeof window !== 'undefined') { // Avoid saving during load and on server
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
    const today = format(new Date(), 'yyyy-MM-dd'); // Get today's date string


     // Load state from localStorage and fetch initial currency on mount
    useEffect(() => {
        let isMounted = true;
        const loadInitialData = async () => {
            setIsLoading(true);
            try {
                // Load from localStorage first
                 const savedStateRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
                 let loadedState: Partial<AppState> = {};
                 if (savedStateRaw) {
                     try {
                        const parsedState = JSON.parse(savedStateRaw);
                        // Basic validation
                        if (typeof parsedState === 'object' && parsedState !== null) {
                             loadedState = {
                                currency: parsedState.currency,
                                budget: parsedState.budget, // Load entire budget object (limit, spent, lastSetDate)
                                shoppingList: Array.isArray(parsedState.shoppingList) ? parsedState.shoppingList : undefined,
                             };
                        }
                     } catch (e) {
                        console.error("Failed to parse saved state:", e);
                        localStorage.removeItem(LOCAL_STORAGE_KEY); // Clear corrupted state
                     }
                 }

                // Fetch user currency - potentially overriding localStorage if different
                const userCurrency = await getUserCurrency();

                 if (isMounted) {
                    // Prioritize fetched currency if it's different from default/loaded storage
                     const finalInitialState = {
                         ...loadedState,
                         currency: userCurrency ?? loadedState.currency ?? defaultCurrency,
                     };
                     // Let the LOAD_STATE reducer handle budget reset logic based on date
                    dispatch({ type: 'LOAD_STATE', payload: finalInitialState });
                 }

            } catch (error) {
                console.error("Failed to load initial data:", error);
                 // Still dispatch loaded state even if currency fetch fails
                  if (isMounted) {
                     const savedStateRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
                     let loadedState: Partial<AppState> = {};
                      if (savedStateRaw) {
                          try {
                                loadedState = JSON.parse(savedStateRaw) as Partial<AppState>;
                          } catch (e) { console.error("Failed to parse saved state on error:", e); }
                      }
                     dispatch({ type: 'LOAD_STATE', payload: loadedState }); // Use loaded state or initial
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
    }, []); // Run only once on mount


    const formatCurrency = useCallback((amount: number): string => {
        try {
            return new Intl.NumberFormat(undefined, { // Use browser locale default
                style: 'currency',
                currency: state.currency.code,
                 minimumFractionDigits: 2,
                 maximumFractionDigits: 2,
            }).format(amount);
        } catch (error) {
            console.warn("Error formatting currency, falling back to default:", error);
            // Fallback for invalid currency codes or errors
            return `${state.currency.symbol}${amount.toFixed(2)}`;
        }
    }, [state.currency]);

    const contextValue = {
        state,
        dispatch,
        formatCurrency,
        isLoading,
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

// --- Export Types ---
export type { AppState, ShoppingListItem, Action, Currency, BudgetItem };
