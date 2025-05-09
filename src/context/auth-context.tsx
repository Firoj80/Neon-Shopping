
"use client";

import React, { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation'; // Use next/navigation for App Router
import { v4 as uuidv4 } from 'uuid';

// Interface for the user object
interface User {
  id: string;
  name: string;
  email: string;
  // Password should not be stored in the user object in context for security reasons
}

// Interface for the AuthContext
interface AuthContextProps {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  signup: (name: string, email: string, pass: string) => Promise<boolean>;
  logout: () => void;
}

// Create the AuthContext
const AuthContext = createContext<AuthContextProps | undefined>(undefined);

// Key for storing user data in localStorage
const USERS_STORAGE_KEY = 'neonShoppingUsers';
// Key for storing the auth token (e.g., user's email or a simple flag) in localStorage
const AUTH_TOKEN_KEY = 'neonShoppingAuthToken';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Function to get users from localStorage
  const getUsersFromStorage = (): User[] => {
    if (typeof window !== 'undefined') {
      const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
      return storedUsers ? JSON.parse(storedUsers) : [];
    }
    return [];
  };

  // Function to save users to localStorage
  const saveUsersToStorage = (users: User[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    }
  };

  // Check session on component mount
  const checkSession = useCallback(async () => {
    setIsLoading(true);
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (token) {
        // For this localStorage example, the token is the user's email
        const users = getUsersFromStorage();
        const loggedInUser = users.find(u => u.email === token);

        if (loggedInUser) {
          setUser(loggedInUser);
          setIsAuthenticated(true);
        } else {
          // Invalid token found, clear it and log out
          localStorage.removeItem(AUTH_TOKEN_KEY);
          setIsAuthenticated(false);
          setUser(null);
          if (pathname !== '/auth') { // Avoid redirect loop if already on auth page
            router.push('/auth');
          }
        }
      } else {
        // No token found
        setIsAuthenticated(false);
        setUser(null);
        // If not on the auth page or create-first page, and not authenticated, redirect to auth
        // This allows unauthenticated users to land on create-first, then be prompted to auth
        if (pathname !== '/auth' && pathname !== '/list/create-first' ) {
          // router.push('/auth'); // Previous logic: always push to /auth if not authenticated and not on /auth
        }
      }
    }
    setIsLoading(false);
  }, [router, pathname]);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const login = async (email: string, pass: string): Promise<boolean> => {
    setIsLoading(true);
    const users = getUsersFromStorage();
    const foundUser = users.find(u => u.email === email);

    // IMPORTANT: This is a highly simplified and INSECURE password check for localStorage demo.
    // In a real application, passwords should be hashed and verified securely on a backend.
    // Here, we're just checking if the user exists.
    if (foundUser) {
      setUser(foundUser);
      setIsAuthenticated(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem(AUTH_TOKEN_KEY, foundUser.email); // Use email as a simple token
      }
      router.push('/list'); // Redirect to main list page after login
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
      // User already exists
      setIsLoading(false);
      // Optionally: show a toast message "User already exists"
      return false;
    }

    const newUser: User = { id: uuidv4(), name, email };
    // IMPORTANT: For localStorage, we're not storing the password.
    // In a real app, the password would be sent to a backend to be securely hashed and stored.
    users.push(newUser);
    saveUsersToStorage(users);

    setUser(newUser);
    setIsAuthenticated(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTH_TOKEN_KEY, newUser.email); // Use email as a simple token
    }
    // After signup, redirect to the page where they create their first list
    router.push('/list/create-first');
    setIsLoading(false);
    return true;
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
    router.push('/auth'); // Redirect to auth page on logout
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
