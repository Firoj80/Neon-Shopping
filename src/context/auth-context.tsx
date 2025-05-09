"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
// import { useAppContext } from './app-context'; // Temporarily Commented Out

// Keys for localStorage
const USERS_STORAGE_KEY = 'neonShoppingUsers';
const AUTH_TOKEN_KEY = 'neonShoppingAuthToken'; // Using email as token for simplicity

interface User {
  id: string;
  name: string;
  email: string;
  // Password should not be stored here for security
}

interface AuthContextProps {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  signup: (name: string, email: string, pass: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  // const { dispatch: appDispatch } = useAppContext(); // Temporarily Commented Out

  console.log("AuthProvider rendering/re-rendering. isLoading:", isLoading, "isAuthenticated:", isAuthenticated);

  const getUsersFromStorage = (): User[] => {
    if (typeof window !== 'undefined') {
      const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
      return storedUsers ? JSON.parse(storedUsers) : [];
    }
    return [];
  };

  const saveUsersToStorage = (users: User[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    }
  };

  const checkSession = useCallback(async () => {
    console.log("AuthContext: checkSession initiated");
    setIsLoading(true);
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      console.log("AuthContext: token from localStorage:", token);
      if (token) {
        const users = getUsersFromStorage();
        const loggedInUser = users.find(u => u.email === token);
        if (loggedInUser) {
          console.log("AuthContext: User found in session:", loggedInUser);
          setUser(loggedInUser);
          setIsAuthenticated(true);
          // appDispatch({ type: 'SET_USER_ID', payload: loggedInUser.id }); // Temporarily Commented Out
          // appDispatch({ type: 'LOAD_STATE_FROM_API', payload: { userId: loggedInUser.id } }); // Temporarily Commented Out
        } else {
          console.log("AuthContext: Invalid token found, clearing session.");
          localStorage.removeItem(AUTH_TOKEN_KEY);
          setIsAuthenticated(false);
          setUser(null);
          // appDispatch({ type: 'SET_USER_ID', payload: null }); // Temporarily Commented Out
          // appDispatch({ type: 'RESET_STATE_TO_INITIAL_FOR_ANONYMOUS' }); // Temporarily Commented Out
          if (pathname !== '/auth') {
            router.push('/auth');
          }
        }
      } else {
        console.log("AuthContext: No token found.");
        setIsAuthenticated(false);
        setUser(null);
        // appDispatch({ type: 'SET_USER_ID', payload: null }); // Temporarily Commented Out
        // appDispatch({ type: 'RESET_STATE_TO_INITIAL_FOR_ANONYMOUS' }); // Temporarily Commented Out
         if (pathname !== '/auth' && !pathname.startsWith('/list/create-first')) {
            // router.push('/auth'); // Let AppLayout handle this
         }
      }
    }
    setIsLoading(false);
    console.log("AuthContext: checkSession completed. isLoading:", false);
  }, [router, pathname]);

  useEffect(() => {
    checkSession();
  }, [checkSession]);


  const login = async (email: string, pass: string): Promise<boolean> => {
    setIsLoading(true);
    const users = getUsersFromStorage();
    // THIS IS A SIMPLIFIED AND INSECURE PASSWORD CHECK FOR localStorage DEMO.
    // In a real application, passwords should be hashed and verified securely on a backend.
    const foundUser = users.find(u => u.email === email && localStorage.getItem(email + '_pass_dummy_ref') === u.id); // Dummy check

    if (foundUser) {
      setUser(foundUser);
      setIsAuthenticated(true);
      localStorage.setItem(AUTH_TOKEN_KEY, foundUser.email);
      // appDispatch({ type: 'SET_USER_ID', payload: foundUser.id }); // Temporarily Commented Out
      // appDispatch({ type: 'LOAD_STATE_FROM_API', payload: { userId: foundUser.id } }); // Temporarily Commented Out
      router.push('/list');
      setIsLoading(false);
      return true;
    }
    setIsLoading(false);
    return false;
  };

  const signup = async (name: string, email: string, pass: string): Promise<boolean> => {
    setIsLoading(true);
    let users = getUsersFromStorage();
    if (users.find(u => u.email === email)) {
      setIsLoading(false);
      return false; // User already exists
    }
    const userId = uuidv4();
    // For localStorage demo, not storing password securely.
    localStorage.setItem(email + '_pass_dummy_ref', userId); // Insecure dummy password ref
    const newUser: User = { id: userId, name, email };
    users.push(newUser);
    saveUsersToStorage(users);

    setUser(newUser);
    setIsAuthenticated(true);
    localStorage.setItem(AUTH_TOKEN_KEY, newUser.email);
    // appDispatch({ type: 'SET_USER_ID', payload: newUser.id }); // Temporarily Commented Out
    // appDispatch({ type: 'LOAD_STATE_FROM_API', payload: { userId: newUser.id } }); // Temporarily Commented Out
    router.push('/list/create-first');
    setIsLoading(false);
    return true;
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    // appDispatch({ type: 'SET_USER_ID', payload: null }); // Temporarily Commented Out
    // appDispatch({ type: 'RESET_STATE_TO_INITIAL_FOR_ANONYMOUS' }); // Temporarily Commented Out
    router.push('/auth');
  };
  
  console.log("AuthContext.Provider is being rendered with value:", { isAuthenticated, user, isLoading });
  return (
    <AuthContext.Provider value={{ isAuthenticated, user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  console.log("useAuth called, context value:", context);
  if (context === undefined) {
    console.error("useAuth error: AuthContext is undefined. Ensure AuthProvider wraps this component.");
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
