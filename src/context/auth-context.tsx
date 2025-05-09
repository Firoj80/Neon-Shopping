// src/context/auth-context.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppContext } from './app-context';
import { fetchFromApi } from '../lib/api';
import { useToast } from '../hooks/use-toast';
import Cookies from 'js-cookie';

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
  const [isLoading, setIsLoading] = useState(true); // Initialize to true
  const router = useRouter();
  const pathname = usePathname();
  const { dispatch: appDispatch, state: appState } = useAppContext();
  const { toast } = useToast();

  const API_BASE_URL = appState.apiBaseUrl;

  const checkSession = useCallback(async () => {
    console.log("AuthContext: Checking session...");
    setIsLoading(true); // Set loading true at the start
    try {
      const response = await fetchFromApi('auth/session_status.php', { method: 'GET' });
      console.log("AuthContext: Session status response", response);

      if (response && response.isAuthenticated && response.user) {
        const fetchedUser = response.user as User;
        setIsAuthenticated(true);
        setUser(fetchedUser);
        appDispatch({ type: 'SET_USER_ID', payload: fetchedUser.id });
        appDispatch({ type: 'SET_PREMIUM_STATUS', payload: !!fetchedUser.isPremium });
        console.log("AuthContext: User authenticated:", fetchedUser.id);
      } else {
        setIsAuthenticated(false);
        setUser(null);
        appDispatch({ type: 'SET_USER_ID', payload: null }); // Ensure app context reflects logged out state
        console.log("AuthContext: User not authenticated or session invalid. Message:", response?.message);
      }
    } catch (error: any) {
      console.error("AuthContext: Error checking session status -", error.message, error.responseBody || error);
      setIsAuthenticated(false);
      setUser(null);
      appDispatch({ type: 'SET_USER_ID', payload: null });
    } finally {
      setIsLoading(false); // Always set loading to false in finally
      console.log("AuthContext: Session check finished. isLoading:", false, "isAuthenticated (after check):", isAuthenticated);
    }
  }, [appDispatch, API_BASE_URL, isAuthenticated]); // Added isAuthenticated to see its value *before* the new check

  useEffect(() => {
    // Initial session check when provider mounts
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
        // Let AppLayout handle redirection based on list state
        // router.push('/list/create-first'); // This might be premature
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
        // Let AppLayout handle redirection
        // router.push('/list/create-first');
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
      appDispatch({ type: 'RESET_STATE_FOR_LOGOUT' }); // Resets app state including userId
      Cookies.remove('auth_token'); // Remove cookie if you were setting one (though PHP session handles it)
      localStorage.removeItem('user_id'); // Clear any local user ID if used pre-auth
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      router.push('/auth'); // Redirect to auth page
      setIsLoading(false);
    }
  };
  console.log("AuthProvider rendering. isLoading:", isLoading, "isAuthenticated:", isAuthenticated);
  return (
    <AuthContext.Provider value={{ isAuthenticated, user, isLoading, login, signup, logout, checkSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextProps => {
  const context = useContext(AuthContext);
  console.log("useAuth called, context value:", context);
  if (context === undefined) {
    console.error("useAuth error: AuthContext is undefined. Ensure AuthProvider wraps this component.");
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
