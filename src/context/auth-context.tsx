// src/context/auth-context.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAppContext } from './app-context';
import { fetchFromApi } from '../lib/api';
import { useToast } from '../hooks/use-toast';
// import Cookies from 'js-cookie'; // Not using cookies for token directly, relying on HttpOnly PHP session cookie

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

const AUTH_ROUTE = '/auth';
const CREATE_FIRST_LIST_ROUTE = '/list/create-first';
const DEFAULT_AUTHENTICATED_ROUTE = '/list'; // Main app page if lists exist

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { dispatch: appDispatch, state: appState } = useAppContext();
  const { toast } = useToast();

  const checkSession = useCallback(async () => {
    console.log("AuthContext: Checking session...");
    setIsLoading(true);
    try {
      const response = await fetchFromApi('auth/session_status.php', { method: 'GET' });
      console.log("AuthContext: Session status response received", response);

      if (response && response.isAuthenticated && response.user) {
        const fetchedUser = response.user as User;
        setIsAuthenticated(true);
        setUser(fetchedUser);
        appDispatch({ type: 'SET_USER_ID', payload: fetchedUser.id });
        appDispatch({ type: 'LOAD_USER_PREFERENCES', payload: { isPremium: !!fetchedUser.isPremium }});
        console.log("AuthContext: User authenticated via session:", fetchedUser.id);
      } else {
        setIsAuthenticated(false);
        setUser(null);
        appDispatch({ type: 'SET_USER_ID', payload: null }); // Ensure app context knows user is null
        console.log("AuthContext: No active session or user not authenticated. Message:", response?.message);
      }
    } catch (error: any) {
      console.error("AuthContext: Error checking session status -", error.message);
      setIsAuthenticated(false);
      setUser(null);
      appDispatch({ type: 'SET_USER_ID', payload: null });
    } finally {
      setIsLoading(false);
      console.log("AuthContext: Session check finished. isLoading:", false, "isAuthenticated (after check):", isAuthenticated);
    }
  }, [appDispatch, toast, isAuthenticated]); // isAuthenticated added for logging current state before check

  useEffect(() => {
    checkSession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
        appDispatch({ type: 'LOAD_USER_PREFERENCES', payload: { isPremium: !!loggedInUser.isPremium }});
        toast({ title: "Login Successful", description: "Welcome back!" });
        
        // Always redirect to create-first, AppLayoutContent will handle if lists exist
        router.push(CREATE_FIRST_LIST_ROUTE);
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
        appDispatch({ type: 'LOAD_USER_PREFERENCES', payload: { isPremium: !!signedUpUser.isPremium }});
        toast({ title: "Signup Successful", description: "Welcome! Your account has been created." });

        // Always redirect to create-first, AppLayoutContent will handle if lists exist (though unlikely after signup)
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
      // No specific token to remove from localStorage if relying on HttpOnly session cookies from PHP
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      router.push(AUTH_ROUTE); // Redirect to login page
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
  console.log("useAuth called, context value:", context);
  if (context === undefined) {
    console.error("useAuth error: AuthContext is undefined. Ensure AuthProvider wraps this component.");
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
