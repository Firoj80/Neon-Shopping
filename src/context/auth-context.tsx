"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation'; // Use next/navigation for App Router
import { useAppContext } from './app-context'; // Assuming context is created here

// Keys for localStorage
const USERS_STORAGE_KEY = 'neonShoppingUsers';
const LOGGED_IN_USER_EMAIL_KEY = 'neonShoppingLoggedInEmail'; // Key to store logged-in user's email

interface User {
  id: string; // Use email as ID for simplicity with localStorage
  name: string;
  email: string;
  // Password should not be stored here for security
}

interface AuthContextProps {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean; // Represents auth loading specifically
  login: (email: string, pass: string) => Promise<boolean>;
  signup: (name: string, email: string, pass: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Auth specific loading state
  const router = useRouter();
  const pathname = usePathname();
  const { dispatch: appDispatch } = useAppContext();

  // --- LocalStorage User Management ---
  const getUsersFromStorage = (): User[] => {
    if (typeof window !== 'undefined') {
      const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
      try {
        return storedUsers ? JSON.parse(storedUsers) : [];
      } catch (e) {
        console.error("Error parsing users from localStorage:", e);
        return []; // Return empty array on error
      }
    }
    return [];
  };

  const saveUsersToStorage = (users: User[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    }
  };

  // --- Session Check ---
  const checkSession = useCallback(async () => {
    console.log("AuthContext: checkSession initiated");
    setIsLoading(true); // Start auth loading
    if (typeof window !== 'undefined') {
      const loggedInEmail = localStorage.getItem(LOGGED_IN_USER_EMAIL_KEY);
      console.log("AuthContext: loggedInEmail from localStorage:", loggedInEmail);
      if (loggedInEmail) {
        const users = getUsersFromStorage();
        const loggedInUser = users.find(u => u.email === loggedInEmail);
        if (loggedInUser) {
          console.log("AuthContext: User found in session:", loggedInUser);
          setUser(loggedInUser);
          setIsAuthenticated(true);
          appDispatch({ type: 'SET_USER_ID', payload: loggedInUser.id }); // Dispatch user ID to AppContext
          // Optional: Load user-specific data if needed (though AppContext handles general load)
          // appDispatch({ type: 'LOAD_STATE_FROM_API', payload: { userId: loggedInUser.id } });
        } else {
          // If email is stored but user doesn't exist (data inconsistency), clear session
          console.log("AuthContext: Inconsistent session data found, clearing.");
          localStorage.removeItem(LOGGED_IN_USER_EMAIL_KEY);
          setIsAuthenticated(false);
          setUser(null);
          appDispatch({ type: 'SET_USER_ID', payload: null });
          // Redirect only if not already on auth page
          if (pathname !== '/auth') {
             router.push('/auth');
          }
        }
      } else {
        console.log("AuthContext: No logged-in user email found.");
        setIsAuthenticated(false);
        setUser(null);
        appDispatch({ type: 'SET_USER_ID', payload: null });
         // Redirect to auth if not already there and not on create-first page (which handles its own redirect)
         // This redirection is now primarily handled by middleware or AppLayout
         // if (pathname !== '/auth' && pathname !== '/list/create-first') {
         //    router.push('/auth');
         // }
      }
    }
     setIsLoading(false); // Finish auth loading
     console.log("AuthContext: checkSession completed. isLoading:", false);
  }, [router, pathname, appDispatch]); // Added appDispatch dependency

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // --- Login ---
  const login = async (email: string, pass: string): Promise<boolean> => {
    setIsLoading(true);
    const users = getUsersFromStorage();
    // THIS IS A SIMPLIFIED AND INSECURE PASSWORD CHECK FOR localStorage DEMO.
    const foundUser = users.find(u => u.email === email && localStorage.getItem(`${u.email}_password`) === pass); // Direct password check (INSECURE)

    if (foundUser) {
      setUser(foundUser);
      setIsAuthenticated(true);
      localStorage.setItem(LOGGED_IN_USER_EMAIL_KEY, foundUser.email);
      appDispatch({ type: 'SET_USER_ID', payload: foundUser.id });
      // Consider loading user-specific data here if necessary
      // appDispatch({ type: 'LOAD_STATE_FROM_API', payload: { userId: foundUser.id } });
      router.push('/list'); // Redirect after successful login
      setIsLoading(false);
      return true;
    }
    setIsLoading(false);
    return false;
  };

  // --- Signup ---
  const signup = async (name: string, email: string, pass: string): Promise<boolean> => {
    setIsLoading(true);
    let users = getUsersFromStorage();
    if (users.find(u => u.email === email)) {
      setIsLoading(false);
      alert("Email already exists."); // Provide user feedback
      return false; // User already exists
    }

    const newUser: User = { id: email, name, email }; // Using email as ID
    users.push(newUser);
    saveUsersToStorage(users);
    // Store password directly in localStorage (VERY INSECURE - for demo only)
    localStorage.setItem(`${email}_password`, pass);

    setUser(newUser);
    setIsAuthenticated(true);
    localStorage.setItem(LOGGED_IN_USER_EMAIL_KEY, newUser.email);
    appDispatch({ type: 'SET_USER_ID', payload: newUser.id });
     // Load initial state or specific data for the new user if needed
     // appDispatch({ type: 'LOAD_STATE_FROM_API', payload: { userId: newUser.id } });

    // Redirect to create first list page AFTER signup
    router.push('/list/create-first');
    setIsLoading(false);
    return true;
  };

  // --- Logout ---
  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem(LOGGED_IN_USER_EMAIL_KEY);
    appDispatch({ type: 'SET_USER_ID', payload: null });
    // Optionally reset other app state parts specific to the user
    // appDispatch({ type: 'RESET_USER_SPECIFIC_STATE' });
    router.push('/auth'); // Redirect to login page after logout
  };

   // Memoize context value to prevent unnecessary re-renders
   const contextValue = useMemo(() => ({
    isAuthenticated,
    user,
    isLoading, // Use the auth-specific loading state
    login,
    signup,
    logout,
   }), [isAuthenticated, user, isLoading]); // Add isLoading dependency


   console.log("AuthContext.Provider rendering with value:", contextValue); // Log provider value
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// --- Hook ---
export const useAuth = (): AuthContextProps => { // Explicit return type
  const context = useContext(AuthContext);
  console.log("useAuth called, context value:", context); // Log context value when hook is used
  if (context === undefined) {
    // This error should ideally not happen if wrapped correctly, but keep the check
    console.error("useAuth error: AuthContext is undefined. Ensure AuthProvider wraps this component.");
    throw new Error('useAuth must be used within an AuthProvider');
  }
  // Return the context directly. Components using it should check the isLoading state.
  return context;
};
