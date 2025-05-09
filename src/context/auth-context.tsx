"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation'; // Use next/navigation for App Router
import { useToast } from '@/hooks/use-toast';

// --- Interfaces ---
interface User {
  name: string;
  email: string;
}

interface AuthContextProps {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  login: (email: string, storedPass: string) => Promise<boolean>; // Using storedPass for local check
  signup: (name: string, email: string, passToStore: string) => Promise<boolean>; // Using passToStore for local storage
  logout: () => void;
}

// --- Context ---
const AuthContext = createContext<AuthContextProps | undefined>(undefined);

// --- Local Storage Keys ---
const AUTH_TOKEN_KEY = 'neon_shopping_auth_token'; // Simple token simulation
const USER_DATA_KEY = 'neon_shopping_users_data'; // Store user info { email: { name, password } }

// --- Provider ---
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start loading until session is checked
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  // --- Load User Data from Local Storage ---
  const loadUsersFromStorage = (): Record<string, { name: string; password?: string }> => {
    if (typeof window === 'undefined') return {}; // Avoid server-side access
    const data = localStorage.getItem(USER_DATA_KEY);
    try {
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.error("Failed to parse user data from localStorage", e);
      return {};
    }
  };

  // --- Save User Data to Local Storage ---
  const saveUsersToStorage = (users: Record<string, { name: string; password?: string }>) => {
    if (typeof window === 'undefined') return; // Avoid server-side access
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(users));
  };

  // --- Check Session on Mount ---
  const checkSession = useCallback(() => {
     setIsLoading(true);
     try {
         if (typeof window !== 'undefined') {
             const token = localStorage.getItem(AUTH_TOKEN_KEY);
             const users = loadUsersFromStorage();
             const loggedInUserEmail = Object.keys(users).find(email => users[email].password === token); // Find user by matching token (simulated password)

             if (token && loggedInUserEmail && users[loggedInUserEmail]) {
                 setUser({ email: loggedInUserEmail, name: users[loggedInUserEmail].name });
                 setIsAuthenticated(true);
                 console.log("Session restored for:", loggedInUserEmail);
             } else {
                 // No valid token or user found, ensure logged out state
                 localStorage.removeItem(AUTH_TOKEN_KEY); // Clear any invalid token
                 setUser(null);
                 setIsAuthenticated(false);
                 // Redirect to auth page if not already there and not on auth page
                 if (pathname !== '/auth') {
                    // router.push('/auth'); // Temporarily disabled redirect for easier testing
                 }
             }
         }
     } catch (error) {
         console.error("Error checking session:", error);
         // Ensure logged out state on error
         if (typeof window !== 'undefined') localStorage.removeItem(AUTH_TOKEN_KEY);
         setUser(null);
         setIsAuthenticated(false);
          if (pathname !== '/auth') {
            // router.push('/auth'); // Temporarily disabled redirect for easier testing
         }
     } finally {
        setIsLoading(false);
     }
  }, [pathname, router]); // Include pathname and router in dependency array

  useEffect(() => {
    checkSession();
  }, [checkSession]); // Run checkSession on mount and when the function itself changes


  // --- Signup Function ---
  const signup = async (name: string, email: string, passToStore: string): Promise<boolean> => {
    if (typeof window === 'undefined') return false; // Avoid server-side access

    const users = loadUsersFromStorage();
    const lowerCaseEmail = email.toLowerCase();

    if (users[lowerCaseEmail]) {
      toast({ title: 'Sign Up Failed', description: 'Email already exists.', variant: 'destructive' });
      return false;
    }

    // **SECURITY WARNING:** Storing password directly is highly insecure.
    // In a real app, HASH the password before storing it.
    // For this localStorage-only example, we store it directly for simplicity.
    users[lowerCaseEmail] = { name, password: passToStore };
    saveUsersToStorage(users);

    // Simulate login by setting the token (using the password as token here)
    localStorage.setItem(AUTH_TOKEN_KEY, passToStore);
    setUser({ name, email: lowerCaseEmail });
    setIsAuthenticated(true);
    return true;
  };

  // --- Login Function ---
  const login = async (email: string, storedPassAttempt: string): Promise<boolean> => {
     if (typeof window === 'undefined') return false; // Avoid server-side access

    const users = loadUsersFromStorage();
    const lowerCaseEmail = email.toLowerCase();
    const storedUser = users[lowerCaseEmail];

    // **SECURITY WARNING:** Comparing plain text passwords is insecure.
    // In a real app, compare the hash of the provided password with the stored hash.
    if (storedUser && storedUser.password === storedPassAttempt) {
      // Simulate login by setting the token (using the password as token here)
      localStorage.setItem(AUTH_TOKEN_KEY, storedPassAttempt);
      setUser({ name: storedUser.name, email: lowerCaseEmail });
      setIsAuthenticated(true);
      return true;
    }

    return false; // Login failed
  };

  // --- Logout Function ---
  const logout = () => {
     if (typeof window === 'undefined') return; // Avoid server-side access
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setUser(null);
    setIsAuthenticated(false);
    router.push('/auth'); // Redirect to login page after logout
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// --- Hook ---
export const useAuth = (): AuthContextProps => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
