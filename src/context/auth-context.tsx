// src/context/auth-context.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation'; // Use next/navigation for App Router
import { useAppContext } from './app-context'; // Assuming appContext is in the same directory
import { fetchFromApi } from '../lib/api';
import { useToast } from '../hooks/use-toast';
// Cookies are HttpOnly, so we can't directly manage 'auth_token' from JS for logout.
// Logout relies on the backend to invalidate the session/cookie.

export interface User {
  id: string;
  name: string;
  email: string;
  isPremium?: boolean; // isPremium status can be part of the user object from backend
}

interface AuthContextProps {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean; // Tracks auth loading state
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>; // For manual re-check if needed
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

const AUTH_ROUTE = '/auth';
const CREATE_FIRST_LIST_ROUTE = '/list/create-first';
const DEFAULT_AUTHENTICATED_ROUTE = '/list';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start true until first session check
  const router = useRouter();
  const pathname = usePathname();
  const { dispatch: appDispatch, state: appState } = useAppContext();
  const { toast } = useToast();

  const checkSession = useCallback(async (isInitialCheck = false) => {
    console.log("AuthContext: Checking session...");
    if (!isInitialCheck) setIsLoading(true); // Set loading for manual checks, initial check handled by main useEffect

    try {
      const response = await fetchFromApi('auth/session_status.php', { method: 'GET' });
      console.log("AuthContext: Session status response:", response);

      if (response && response.isAuthenticated && response.user) {
        const fetchedUser = response.user as User;
        setIsAuthenticated(true);
        setUser(fetchedUser);
        appDispatch({ type: 'SET_USER_ID', payload: fetchedUser.id });
        // User preferences (like premium status) will be loaded by AppContext's API data fetch
        // or can be set here if API returns it directly.
        if (fetchedUser.isPremium !== undefined) {
            appDispatch({ type: 'SET_PREMIUM_STATUS', payload: !!fetchedUser.isPremium });
        }
        console.log("AuthContext: User authenticated via session:", fetchedUser.id);
      } else {
        console.log("AuthContext: No active session or user not authenticated from API. Message:", response?.message);
        setIsAuthenticated(false);
        setUser(null);
        appDispatch({ type: 'RESET_STATE_FOR_LOGOUT' }); // Use reset which sets anon ID
      }
    } catch (error: any) {
      console.error("AuthContext: Error checking session status -", error.message);
      setIsAuthenticated(false);
      setUser(null);
      appDispatch({ type: 'RESET_STATE_FOR_LOGOUT' });
    } finally {
      setIsLoading(false);
      console.log("AuthContext: Session check finished. isLoading:", false, "isAuthenticated (after check):", isAuthenticated);
    }
  }, [appDispatch, toast, isAuthenticated]); // isAuthenticated added for logging current state

  useEffect(() => {
    checkSession(true); // Initial session check on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const handleAuthSuccess = async (loggedInUser: User) => {
    setIsAuthenticated(true);
    setUser(loggedInUser);
    appDispatch({ type: 'SET_USER_ID', payload: loggedInUser.id });
     // AppContext will fetch user-specific data using this new ID, including lists.
     // Premium status might come with user object or AppContext fetches it.
    if (loggedInUser.isPremium !== undefined) {
      appDispatch({ type: 'SET_PREMIUM_STATUS', payload: !!loggedInUser.isPremium });
    }
    // AppContext's useEffect for fetching API data will now run due to userId change.
    // After AppContext loads data (lists, etc.), AppLayoutContent will handle final redirection.
    // For now, redirect to a common authenticated entry point.
    router.push(CREATE_FIRST_LIST_ROUTE);
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await fetchFromApi('auth/login.php', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (response.success && response.user) {
        await handleAuthSuccess(response.user as User);
        toast({ title: "Login Successful", description: "Welcome back!" });
        return true;
      } else {
        toast({ title: "Login Failed", description: response.message || "Please check your credentials.", variant: "destructive" });
        return false;
      }
    } catch (error: any) {
      toast({ title: "Login Error", description: error.message || "An error occurred.", variant: "destructive" });
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
        await handleAuthSuccess(response.user as User);
        toast({ title: "Signup Successful", description: "Welcome! Your account has been created." });
        return true;
      } else {
        toast({ title: "Signup Failed", description: response.message || "Could not create account.", variant: "destructive" });
        return false;
      }
    } catch (error: any) {
      toast({ title: "Signup Error", description: error.message || "An error occurred.", variant: "destructive" });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await fetchFromApi('auth/logout.php', { method: 'POST' });
      // Backend handles cookie invalidation.
    } catch (error) {
      console.error("Logout API call failed, proceeding with client-side logout:", error);
    } finally {
      setIsAuthenticated(false);
      setUser(null);
      appDispatch({ type: 'RESET_STATE_FOR_LOGOUT' });
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      // Redirect to auth page, clear any query params
      const authRedirectUrl = new URL(AUTH_ROUTE, window.location.origin);
      router.push(authRedirectUrl.toString());
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
