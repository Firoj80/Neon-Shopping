"use client";
import type React from 'react';
import { createContext, useContext, useReducer, useEffect, useState, useCallback } from 'react';
import type { Currency } from '@/services/currency';
import { getUserCurrency } from '@/services/currency';

// --- Types ---
interface BudgetItem {
    limit: number;
    spent: number;
}

interface AppState {
    currency: Currency;
    budget: BudgetItem;
    shoppingList: ShoppingListItem[];
}

interface ShoppingListItem {
    id: string;
    name: string;
    quantity: number;
    price: number;
    category: string;
    checked: boolean;
    dateAdded: number; // Timestamp
}

type Action =
    | { type: 'SET_CURRENCY'; payload: Currency }
    | { type: 'SET_BUDGET_LIMIT'; payload: number }
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
    budget: { limit: 0, spent: 0 },
    shoppingList: [],
};

const LOCAL_STORAGE_KEY = 'neonWalletState';

function appReducer(state: AppState, action: Action): AppState {
    let newState: AppState;
    switch (action.type) {
        case 'SET_CURRENCY':
            newState = { ...state, currency: action.payload };
            break;
        case 'SET_BUDGET_LIMIT':
            newState = { ...state, budget: { ...state.budget, limit: action.payload } };
            break;
        case 'ADD_SHOPPING_ITEM': {
            const newItem: ShoppingListItem = {
                ...action.payload,
                id: crypto.randomUUID(),
                dateAdded: Date.now(),
            };
            newState = { ...state, shoppingList: [newItem, ...state.shoppingList] };
             // Update spent amount
            newState.budget.spent = calculateSpent(newState.shoppingList);
            break;
        }
         case 'UPDATE_SHOPPING_ITEM':
             newState = {
                 ...state,
                 shoppingList: state.shoppingList.map((item) =>
                     item.id === action.payload.id ? action.payload : item
                 ),
             };
              // Update spent amount
             newState.budget.spent = calculateSpent(newState.shoppingList);
             break;
        case 'REMOVE_SHOPPING_ITEM':
            newState = {
                ...state,
                shoppingList: state.shoppingList.filter((item) => item.id !== action.payload),
            };
             // Update spent amount
            newState.budget.spent = calculateSpent(newState.shoppingList);
            break;
        case 'TOGGLE_SHOPPING_ITEM':
            newState = {
                ...state,
                shoppingList: state.shoppingList.map((item) =>
                    item.id === action.payload ? { ...item, checked: !item.checked } : item
                ),
            };
            // Note: Toggling doesn't change the spent amount, only adding/removing/updating price does.
            break;
         case 'LOAD_STATE':
            // Carefully merge loaded state, prioritizing loaded values but keeping defaults if missing
            newState = {
                currency: action.payload.currency || state.currency,
                budget: {
                    limit: action.payload.budget?.limit ?? state.budget.limit,
                    spent: calculateSpent(action.payload.shoppingList || state.shoppingList), // Recalculate spent based on loaded/current list
                },
                shoppingList: action.payload.shoppingList || state.shoppingList,
            };
            break;
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

// Helper to calculate spent amount
const calculateSpent = (list: ShoppingListItem[]): number => {
     return list.reduce((total, item) => total + (item.price * item.quantity), 0);
}

// --- Context & Provider ---
const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, initialState);
    const [isLoading, setIsLoading] = useState(true);


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
                                budget: parsedState.budget,
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
