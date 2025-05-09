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
  subscriptionStatus?: 'free' | 'premium';
  subscriptionExpiryDate?: string | null;
}

interface AuthContextProps {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { dispatch: appDispatch } = useAppContext(); // Removed appState as it's not directly used here for redirection logic

  // API_BASE_URL is handled by fetchFromApi utility
  // const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/neon/api';

  const checkSession = useCallback(async () => {
    console.log("AuthContext: Checking session...");
    setIsLoading(true);
    try {
      const response = await fetchFromApi('auth/session_status.php', { method: 'GET' });
      console.log("AuthContext: Session status response", response);

      if (response && response.isAuthenticated && response.user) {
        setIsAuthenticated(true);
        const fetchedUser = response.user as User;
        setUser(fetchedUser);
        appDispatch({ type: 'SET_USER_ID', payload: fetchedUser.id });
        appDispatch({ type: 'SET_PREMIUM_STATUS', payload: !!fetchedUser.isPremium });
        // Load user-specific data now that we know the user ID
        appDispatch({ type: 'LOAD_STATE_FROM_API', payload: { userId: fetchedUser.id, apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || '/neon/api' } });


        if (pathname === '/auth') {
          console.log("AuthContext: Authenticated, on /auth, redirecting to /list/create-first");
          router.replace('/list/create-first');
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
        appDispatch({ type: 'SET_USER_ID', payload: null });
        if (pathname !== '/auth' && !isLoading) {
           // Let middleware handle primary redirection
        }
      }
    } catch (error: any) {
      console.error("AuthContext: Error checking session status -", error.message);
      setIsAuthenticated(false);
      setUser(null);
      appDispatch({ type: 'SET_USER_ID', payload: null });
    } finally {
      setIsLoading(false);
      console.log("AuthContext: Session check finished. isLoading:", false, "isAuthenticated:", isAuthenticated);
    }
  }, [router, pathname, appDispatch, isLoading, isAuthenticated]); // Added isAuthenticated to dependencies

  useEffect(() => {
    checkSession();
  }, [pathname]);


  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await fetchFromApi('auth/login.php', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (response.success && response.user) {
        setIsAuthenticated(true);
        const loggedInUser = response.user as User;
        setUser(loggedInUser);
        appDispatch({ type: 'SET_USER_ID', payload: loggedInUser.id });
        appDispatch({ type: 'SET_PREMIUM_STATUS', payload: !!loggedInUser.isPremium });
        appDispatch({ type: 'LOAD_STATE_FROM_API', payload: { userId: loggedInUser.id, apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || '/neon/api' } });
        // Redirection to /list or /list/create-first will be handled by AppLayout after data loads
        return true;
      } else {
        console.error("Login failed:", response.message);
        // Use toast for user feedback
        // toast({ title: "Login Failed", description: response.message || "Please check your credentials.", variant: "destructive" });
        alert(response.message || "Login failed. Please check your credentials.");
        return false;
      }
    } catch (error: any) {
      console.error("Login error:", error);
      // toast({ title: "Login Error", description: error.message || "An error occurred during login.", variant: "destructive" });
      alert(error.message || "An error occurred during login.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await fetchFromApi('auth/register.php', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });
      if (response.success && response.user) {
        setIsAuthenticated(true);
        const signedUpUser = response.user as User;
        setUser(signedUpUser);
        appDispatch({ type: 'SET_USER_ID', payload: signedUpUser.id });
        appDispatch({ type: 'SET_PREMIUM_STATUS', payload: !!signedUpUser.isPremium });
        appDispatch({ type: 'LOAD_STATE_FROM_API', payload: { userId: signedUpUser.id, apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || '/neon/api' } });
        // Redirection handled by AppLayout
        return true;
      } else {
        console.error("Signup failed:", response.message);
        // toast({ title: "Signup Failed", description: response.message || "Could not create account.", variant: "destructive" });
        alert(response.message || "Signup failed. Please try again.");
        return false;
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      // toast({ title: "Signup Error", description: error.message || "An error occurred during signup.", variant: "destructive" });
      alert(error.message || "An error occurred during signup.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await fetchFromApi('auth/logout.php', { method: 'POST' });
    } catch (error) {
      console.error("Logout API call failed, proceeding with client-side logout:", error);
    } finally {
      setIsAuthenticated(false);
      setUser(null);
      appDispatch({ type: 'RESET_STATE_FOR_LOGOUT' });
      router.push('/auth');
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
  if (context === undefined) {
    console.error("useAuth error: AuthContext is undefined. Ensure AuthProvider wraps this component.");
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
