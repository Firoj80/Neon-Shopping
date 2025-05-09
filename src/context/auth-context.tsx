// src/context/auth-context.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppContext } from './app-context'; // Ensure this path is correct
import { fetchFromApi } from '@/lib/api'; // Ensure this path is correct
import { useToast } from '@/hooks/use-toast';

export interface User {
  id: string;
  name: string;
  email: string;
  isPremium?: boolean;
  // subscriptionStatus?: 'free' | 'premium'; // Redundant if isPremium is used
  // subscriptionExpiryDate?: string | null;
}

interface AuthContextProps {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>; // Make logout async
  checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { dispatch: appDispatch } = useAppContext();
  const { toast } = useToast();

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL; // Used for constructing full URLs if needed, but fetchFromApi handles it

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
        appDispatch({ type: 'LOAD_STATE_FROM_API', payload: { userId: fetchedUser.id, apiBaseUrl: API_BASE_URL || '/api' } });

        if (pathname === '/auth') {
          console.log("AuthContext: Authenticated, on /auth, redirecting to /list/create-first");
          router.replace('/list/create-first'); // Or to '/list' if lists might exist
        }
      } else {
        // This case means session is not valid or API returned isAuthenticated: false
        setIsAuthenticated(false);
        setUser(null);
        appDispatch({ type: 'SET_USER_ID', payload: null });
        if (pathname !== '/auth' && !pathname.startsWith('/_next/')) { // Don't redirect internal Next.js routes
             console.log("AuthContext: Not authenticated, current path:", pathname, "Redirecting to /auth");
             // router.push('/auth'); // Consider if middleware should primarily handle this
        }
      }
    } catch (error: any) {
      console.error("AuthContext: Error checking session status -", error.message, error.responseBody || error);
      setIsAuthenticated(false);
      setUser(null);
      appDispatch({ type: 'SET_USER_ID', payload: null });
       // If on a protected route, redirect to auth
      if (pathname !== '/auth' && !isLoading && !pathname.startsWith('/_next/')) {
          // console.log("AuthContext: Error, current path:", pathname, "Redirecting to /auth");
          // router.push('/auth');
      }
    } finally {
      setIsLoading(false);
      console.log("AuthContext: Session check finished. isLoading:", isLoading, "isAuthenticated:", isAuthenticated);
    }
  }, [router, pathname, appDispatch, API_BASE_URL, isLoading, isAuthenticated]); // Added isLoading and isAuthenticated

   useEffect(() => {
    // Avoid running checkSession if already loading to prevent race conditions
    if (!isLoading) {
        checkSession();
    }
    // Intentionally not including checkSession in deps to avoid loop if it causes state changes that re-trigger this effect.
    // Pathname is a good trigger. isLoading ensures it doesn't run prematurely.
  }, [pathname, isLoading]);


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
        appDispatch({ type: 'LOAD_STATE_FROM_API', payload: { userId: loggedInUser.id, apiBaseUrl: API_BASE_URL || '/api' } });
        toast({ title: "Login Successful", description: "Welcome back!" });
        router.push('/list/create-first'); // Redirect after successful login
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
        appDispatch({ type: 'LOAD_STATE_FROM_API', payload: { userId: signedUpUser.id, apiBaseUrl: API_BASE_URL || '/api' } });
        toast({ title: "Signup Successful", description: "Welcome! Your account has been created." });
        router.push('/list/create-first'); // Redirect after successful signup
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
      appDispatch({ type: 'RESET_STATE_FOR_LOGOUT' }); // Ensure app state is reset
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
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
  // console.log("useAuth called, context value:", context); // Debug log
  if (context === undefined) {
    console.error("useAuth error: AuthContext is undefined. Ensure AuthProvider wraps this component.");
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

    