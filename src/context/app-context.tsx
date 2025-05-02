
"use client";
import type React from 'react';
import { createContext, useContext, useReducer, useEffect, useState, useCallback } from 'react';
import type { Currency } from '@/services/currency';
import { getUserCurrency } from '@/services/currency';
import { format, startOfDay, isSameDay } from 'date-fns'; // Import additional date-fns helpers

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
    | { type: 'RESET_DAILY_BUDGET'; payload: { today: string } } // Pass today's date
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
const calculateTodaysSpent = (list: ShoppingListItem[], todayDate: Date): number => {
     const startOfTodayTimestamp = startOfDay(todayDate).getTime();

    return list
        .filter(item => item.checked && item.dateAdded >= startOfTodayTimestamp) // Only include items checked today
        .reduce((total, item) => total + (item.price * item.quantity), 0);
};


function appReducer(state: AppState, action: Action): AppState {
    let newState: AppState;
    // Moved today calculation inside actions that need it or rely on client-side useEffect
    // const today = format(new Date(), 'yyyy-MM-dd');

    switch (action.type) {
        case 'SET_CURRENCY':
            newState = { ...state, currency: action.payload };
            break;
        case 'SET_BUDGET_LIMIT': {
             // When setting limit, also update the date and recalculate today's spent
            const todayDate = new Date(); // Calculate today's date here
            newState = {
                ...state,
                budget: {
                    ...state.budget,
                    limit: action.payload.limit,
                    lastSetDate: action.payload.date, // Store the date
                    spent: calculateTodaysSpent(state.shoppingList, todayDate), // Recalculate spent for today
                }
            };
            break;
        }
         case 'RESET_DAILY_BUDGET': {
             // Reset limit to 0, keep spent calculation based on today's items
             const todayDate = new Date(); // Calculate today's date here
            newState = {
                ...state,
                budget: {
                     limit: 0, // Reset limit
                     spent: calculateTodaysSpent(state.shoppingList, todayDate), // Recalculate spent for today
                     lastSetDate: action.payload.today, // Update date to today's string passed in payload
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
             // Adding an item doesn't change today's *spent* amount unless it's immediately checked (handled by TOGGLE)
            newState = { ...state, shoppingList: [newItem, ...state.shoppingList] };
            break;
        }
         case 'UPDATE_SHOPPING_ITEM': {
             const updatedList = state.shoppingList.map((item) =>
                 item.id === action.payload.id ? action.payload : item
             );
              // Update can change checked status, so recalculate today's spent
             const todayDate = new Date(); // Calculate today's date here
             newState = {
                 ...state,
                 shoppingList: updatedList,
                 budget: { ...state.budget, spent: calculateTodaysSpent(updatedList, todayDate) }
             };
             break;
            }
        case 'REMOVE_SHOPPING_ITEM': {
            const filteredList = state.shoppingList.filter((item) => item.id !== action.payload);
             // Removing an item might change today's spent if it was checked today
             const todayDate = new Date(); // Calculate today's date here
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
             // Toggling directly affects today's spent calculation
             const todayDate = new Date(); // Calculate today's date here
            newState = {
                ...state,
                shoppingList: toggledList,
                budget: { ...state.budget, spent: calculateTodaysSpent(toggledList, todayDate) }
            };
            break;
        }
         case 'LOAD_STATE': {
            // This action purely loads data; budget reset is handled in useEffect
            const loadedList = action.payload.shoppingList || initialState.shoppingList;
            const loadedBudget = action.payload.budget || initialState.budget;
            const loadedCurrency = action.payload.currency || initialState.currency;

            // Initial spent calculation uses current date, but might be adjusted by useEffect
            const todayDate = new Date();
            const initialSpent = calculateTodaysSpent(loadedList, todayDate);

            newState = {
                currency: loadedCurrency,
                budget: {
                    limit: loadedBudget.limit,
                    spent: initialSpent, // Calculate initial spent based on loaded list
                    lastSetDate: loadedBudget.lastSetDate,
                },
                shoppingList: loadedList,
            };
            break;
         }
        default:
            newState = state;
    }

     // Persist state changes AFTER calculating new state
     // Only save to localStorage on the client-side, outside the initial LOAD_STATE
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
    // State to track if initial load/hydration is complete
    const [isHydrated, setIsHydrated] = useState(false);

    // Effect 1: Load initial state from localStorage and fetch currency (runs once on mount)
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
                            };
                        }
                    } catch (e) {
                        console.error("Failed to parse saved state:", e);
                        localStorage.removeItem(LOCAL_STORAGE_KEY);
                    }
                }

                const userCurrency = await getUserCurrency();

                if (isMounted) {
                    const finalInitialState = {
                        ...loadedStateFromStorage,
                        currency: userCurrency ?? loadedStateFromStorage.currency ?? defaultCurrency,
                    };
                    // Dispatch LOAD_STATE only with data from storage/fetch
                    dispatch({ type: 'LOAD_STATE', payload: finalInitialState });
                    setIsHydrated(true); // Mark hydration as complete
                }

            } catch (error) {
                console.error("Failed to load initial data:", error);
                // Still dispatch potentially loaded state even if currency fetch fails
                if (isMounted) {
                     dispatch({ type: 'LOAD_STATE', payload: loadedStateFromStorage }); // Use loaded state or initial
                     setIsHydrated(true); // Mark hydration as complete even on error
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
    }, []); // Empty dependency array: runs only once on mount

    // Effect 2: Check for daily budget reset (runs *after* hydration and when state.budget.lastSetDate changes)
    useEffect(() => {
        // Only run this check *after* the initial state has been loaded/hydrated
        if (!isLoading && isHydrated) {
            const today = new Date();
            const todayString = format(today, 'yyyy-MM-dd');
            const lastSetDate = state.budget.lastSetDate ? new Date(state.budget.lastSetDate + 'T00:00:00') : null; // Ensure comparison is date-only

            // If lastSetDate is null or not today, reset the daily budget
            if (!lastSetDate || !isSameDay(today, lastSetDate)) {
                // console.log("Resetting daily budget for:", todayString);
                dispatch({ type: 'RESET_DAILY_BUDGET', payload: { today: todayString } });
                // Optionally notify user:
                // toast({ title: "New Day!", description: "Your daily budget has been reset." });
            } else {
                 // If it IS the same day, ensure 'spent' is correctly calculated based on the current list state
                 // This handles cases where the list might change during the day after initial load
                const currentSpent = calculateTodaysSpent(state.shoppingList, today);
                if (currentSpent !== state.budget.spent) {
                    // Only update if spent amount actually changed (optimization)
                    // This requires a new action or adjusting RESET_DAILY_BUDGET to optionally just update spent
                    // For simplicity, we might recalculate within SET_BUDGET_LIMIT or other list actions
                    // Let's rely on list modification actions to update spent correctly for now.
                }
            }
        }
    }, [isLoading, isHydrated, state.budget.lastSetDate, state.shoppingList]); // Re-run if hydration status, loading status, lastSetDate, or shoppingList changes


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

    // Pass the potentially still loading state until hydrated
    const contextValue = {
        state,
        dispatch,
        formatCurrency,
        isLoading: isLoading || !isHydrated, // Consider it loading until fully hydrated
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

    