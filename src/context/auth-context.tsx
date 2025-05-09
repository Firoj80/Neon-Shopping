// src/context/auth-context.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation'; // Added useSearchParams
import { useAppContext } from './app-context'; // Ensure this path is correct
import { fetchFromApi } from '../lib/api';
import { useToast } from '../hooks/use-toast';
import Cookies from 'js-cookie'; // Keep js-cookie import

// Define route constants for clarity
const AUTH_ROUTE = '/auth';
const CREATE_FIRST_LIST_ROUTE = '/list/create-first';
const DEFAULT_AUTHENTICATED_ROUTE = '/list';

export interface User {
  id: string;
  name: string;
  email: string;
  isPremium?: boolean;
}

interface AuthContextProps {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams(); // For reading query parameters
  const { dispatch: appDispatch, state: appState } = useAppContext();
  const { toast } = useToast();

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  const checkSession = useCallback(async () => {
    console.log("AuthContext: Checking session...");
    setIsLoading(true);
    try {
      const response = await fetchFromApi('auth/session_status.php', { method: 'GET' });
      console.log("AuthContext: Session status response", response);

      if (response && response.isAuthenticated && response.user) {
        const fetchedUser = response.user as User;
        setIsAuthenticated(true);
        setUser(fetchedUser);
        appDispatch({ type: 'SET_USER_ID', payload: fetchedUser.id });
        appDispatch({ type: 'SET_PREMIUM_STATUS', payload: !!fetchedUser.isPremium });
        console.log("AuthContext: User authenticated via session:", fetchedUser.id);
      } else {
        setIsAuthenticated(false);
        setUser(null);
        appDispatch({ type: 'SET_USER_ID', payload: null });
        console.log("AuthContext: User not authenticated or session invalid. Message:", response?.message || "No active session");
      }
    } catch (error: any) {
      console.error("AuthContext: Error checking session status -", error.message, error.responseBody || error);
      setIsAuthenticated(false);
      setUser(null);
      appDispatch({ type: 'SET_USER_ID', payload: null });
    } finally {
      setIsLoading(false);
      console.log("AuthContext: Session check finished. isLoading:", false, "isAuthenticated (after check):", isAuthenticated);
    }
  }, [appDispatch, API_BASE_URL, isAuthenticated]); // isAuthenticated included for logging its state before check

  useEffect(() => {
    checkSession();
  }, []); // Run only once on mount

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await fetchFromApi('auth/login.php', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (response.success && response.user) {
        const loggedInUser = response.user as User;
        setIsAuthenticated(true);
        setUser(loggedInUser);
        appDispatch({ type: 'SET_USER_ID', payload: loggedInUser.id });
        appDispatch({ type: 'SET_PREMIUM_STATUS', payload: !!loggedInUser.isPremium });
        toast({ title: "Login Successful", description: "Welcome back!" });

        const redirectedFrom = searchParams.get('redirectedFrom');
        if (redirectedFrom && redirectedFrom !== AUTH_ROUTE && redirectedFrom !== '/') {
          router.push(redirectedFrom);
        } else {
          // Default redirect to /list, AppLayout will handle if /list/create-first is needed
          router.push(DEFAULT_AUTHENTICATED_ROUTE);
        }
        return true;
      } else {
        toast({ title: "Login Failed", description: response.message || "Please check your credentials.", variant: "destructive" });
        return false;
      }
    } catch (error: any) {
      toast({ title: "Login Error", description: error.message || "An error occurred during login.", variant: "destructive" });
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
        const signedUpUser = response.user as User;
        setIsAuthenticated(true);
        setUser(signedUpUser);
        appDispatch({ type: 'SET_USER_ID', payload: signedUpUser.id });
        appDispatch({ type: 'SET_PREMIUM_STATUS', payload: !!signedUpUser.isPremium });
        toast({ title: "Signup Successful", description: "Welcome! Your account has been created." });
        // After signup, user definitely has no lists, so redirect to create their first list.
        router.push(CREATE_FIRST_LIST_ROUTE);
        return true;
      } else {
        toast({ title: "Signup Failed", description: response.message || "Could not create account.", variant: "destructive" });
        return false;
      }
    } catch (error: any) {
      toast({ title: "Signup Error", description: error.message || "An error occurred during signup.", variant: "destructive" });
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
      // Cookies.remove('auth_token'); // Not strictly needed if HttpOnly PHP session cookies are used
      localStorage.removeItem(`${appState.userId}_neonShoppingState_v3`); // Clear specific user's state
      localStorage.removeItem('anonymous_user_id_neon_shopping'); // Clear anonymous ID as well
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      router.push(AUTH_ROUTE);
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
