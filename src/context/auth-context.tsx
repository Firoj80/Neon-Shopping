// src/context/auth-context.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppContext } from './app-context';
import { fetchFromApi } from '@/lib/api';

// Define types
export interface User {
  id: string;
  name: string;
  email: string;
  isPremium?: boolean;
  // Add other user properties as needed
}

interface AuthContextProps {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkSession: () => Promise<void>; // Exposed for potential manual checks
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start with loading true
  const router = useRouter();
  const pathname = usePathname();
  const { dispatch: appDispatch, state: appState } = useAppContext();

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api'; // Make sure this is correct

  const checkSession = useCallback(async () => {
    console.log("AuthContext: Checking session...");
    setIsLoading(true);
    try {
      // Attempt to fetch session status from the backend
      const response = await fetchFromApi(`${API_BASE_URL}/auth/session_status.php`, { method: 'GET' });
      console.log("AuthContext: Session status response", response);

      if (response && response.isAuthenticated && response.user) {
        setIsAuthenticated(true);
        setUser(response.user as User);
        appDispatch({ type: 'SET_USER_ID', payload: response.user.id });
        appDispatch({ type: 'SET_PREMIUM_STATUS', payload: !!response.user.isPremium });

        // If authenticated and on the auth page, redirect
        if (pathname === '/auth') {
          console.log("AuthContext: Authenticated, on /auth, redirecting to /list/create-first");
          router.replace('/list/create-first');
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
        appDispatch({ type: 'SET_USER_ID', payload: null });
        // If not authenticated and not on auth page, redirect (middleware should primarily handle this)
        // This client-side redirect is a fallback or for specific cases after initial load
        if (pathname !== '/auth' && !isLoading) { // Added !isLoading to prevent redirect during initial load race conditions
          console.log("AuthContext: Not authenticated, not on /auth, redirecting to /auth. Current pathname:", pathname);
         // router.push('/auth?redirect=' + pathname); // Let middleware handle redirection primarily
        }
      }
    } catch (error: any) {
      console.error("AuthContext: Error checking session status -", error.message);
      setIsAuthenticated(false);
      setUser(null);
      appDispatch({ type: 'SET_USER_ID', payload: null });
      // if (pathname !== '/auth' && !isLoading) { // Added !isLoading
      //   console.log("AuthContext: Error, redirecting to /auth. Current pathname:", pathname);
      //    router.push('/auth?redirect=' + pathname); // Let middleware handle redirection
      // }
    } finally {
      setIsLoading(false);
      console.log("AuthContext: Session check finished. isLoading:", false);
    }
  }, [router, pathname, appDispatch, API_BASE_URL, isLoading]); // Added isLoading to dependency array

  useEffect(() => {
    checkSession();
  }, [pathname]); // Rerun checkSession if pathname changes, e.g., after login/logout redirect


  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await fetchFromApi(`${API_BASE_URL}/auth/login.php`, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (response.success && response.user) {
        setIsAuthenticated(true);
        setUser(response.user as User);
        appDispatch({ type: 'SET_USER_ID', payload: response.user.id });
        appDispatch({ type: 'SET_PREMIUM_STATUS', payload: !!response.user.isPremium });
        // After successful login, load user-specific data
        appDispatch({ type: 'LOAD_STATE_FROM_API', payload: { userId: response.user.id, apiBaseUrl: API_BASE_URL } });
        router.replace(response.user.lists > 0 ? '/list' : '/list/create-first');
        return true;
      } else {
        console.error("Login failed:", response.message);
        alert(response.message || "Login failed. Please check your credentials.");
        return false;
      }
    } catch (error: any) {
      console.error("Login error:", error);
      alert(error.message || "An error occurred during login.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await fetchFromApi(`${API_BASE_URL}/auth/register.php`, {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });
      if (response.success && response.user) {
        setIsAuthenticated(true);
        setUser(response.user as User);
        appDispatch({ type: 'SET_USER_ID', payload: response.user.id });
        appDispatch({ type: 'SET_PREMIUM_STATUS', payload: !!response.user.isPremium });
         // After successful signup, load initial empty state for this user or trigger API load
        appDispatch({ type: 'LOAD_STATE_FROM_API', payload: { userId: response.user.id, apiBaseUrl: API_BASE_URL } });
        router.replace('/list/create-first');
        return true;
      } else {
        console.error("Signup failed:", response.message);
        alert(response.message || "Signup failed. Please try again.");
        return false;
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      alert(error.message || "An error occurred during signup.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await fetchFromApi(`${API_BASE_URL}/auth/logout.php`, { method: 'POST'});
    } catch (error) {
      console.error("Logout API call failed, proceeding with client-side logout:", error);
    } finally {
      setIsAuthenticated(false);
      setUser(null);
      appDispatch({ type: 'SET_USER_ID', payload: null });
      appDispatch({ type: 'RESET_STATE_FOR_LOGOUT' }); // Clear user-specific app data
      router.push('/auth'); // Redirect to login page
      setIsLoading(false);
    }
  };
  

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, isLoading, login, signup, logout, checkSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextProps => {
  const context = useContext(AuthContext);
  // console.log("useAuth called, context value:", context); // For debugging
  if (context === undefined) {
    // console.error("useAuth error: AuthContext is undefined. Ensure AuthProvider wraps this component."); // For debugging
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
