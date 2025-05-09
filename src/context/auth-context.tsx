"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppContext } from './app-context'; // Assuming context is created here
import { useToast } from '@/hooks/use-toast';

// --- Configuration ---
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/php'; // Replace with your actual PHP API base URL

interface User {
  id: string;
  name: string;
  email: string;
  // No password stored client-side
}

interface AuthContextProps {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  signup: (name: string, email: string, pass: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { dispatch: appDispatch, state: appState } = useAppContext();
  const { toast } = useToast();

  const checkSession = useCallback(async () => {
    console.log("AuthContext: checkSession initiated");
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/session_status.php`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.isAuthenticated && data.user) {
          console.log("AuthContext: User session valid:", data.user);
          setUser(data.user);
          setIsAuthenticated(true);
          appDispatch({ type: 'SET_USER_ID', payload: data.user.id });
          // Trigger data load for authenticated user
          appDispatch({ type: 'LOAD_STATE_FROM_API', payload: { userId: data.user.id, currencyCode: appState.currency.code } });
        } else {
          console.log("AuthContext: No active session found or invalid data.");
          setIsAuthenticated(false);
          setUser(null);
          appDispatch({ type: 'SET_USER_ID', payload: null });
          if (pathname !== '/auth' && !pathname.startsWith('/list/create-first')) { // Avoid redirect loops
             // router.push('/auth'); // Let AppLayout handle initial redirect based on lists
          }
        }
      } else {
        // Handle non-OK responses (e.g., server error)
        console.error("AuthContext: Error checking session status -", response.statusText);
        setIsAuthenticated(false);
        setUser(null);
        appDispatch({ type: 'SET_USER_ID', payload: null });
      }
    } catch (error) {
      console.error("AuthContext: Error in checkSession fetch:", error);
      setIsAuthenticated(false);
      setUser(null);
      appDispatch({ type: 'SET_USER_ID', payload: null });
      // Potentially redirect to auth or show an error if API is unreachable
    } finally {
      setIsLoading(false);
      console.log("AuthContext: checkSession completed. isLoading:", false, "isAuthenticated:", isAuthenticated);
    }
  }, [pathname, appDispatch, appState.currency.code, isAuthenticated]); // Added isAuthenticated to dependencies

  useEffect(() => {
    checkSession();
  }, [checkSession]); // checkSession is memoized, so this runs once on mount

  const login = async (email: string, pass: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
      });
      const data = await response.json();

      if (response.ok && data.success && data.user) {
        setUser(data.user);
        setIsAuthenticated(true);
        appDispatch({ type: 'SET_USER_ID', payload: data.user.id });
        appDispatch({ type: 'LOAD_STATE_FROM_API', payload: { userId: data.user.id, currencyCode: appState.currency.code } }); // Load data after login
        toast({ title: 'Login Successful', description: 'Welcome back!' });
        router.push(appState.lists && appState.lists.length > 0 ? '/list' : '/list/create-first');
        setIsLoading(false);
        return true;
      } else {
        toast({ title: 'Login Failed', description: data.message || 'Invalid email or password.', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({ title: 'Login Error', description: 'An unexpected error occurred.', variant: 'destructive' });
    }
    setIsLoading(false);
    return false;
  };

  const signup = async (name: string, email: string, pass: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password: pass }),
      });
      const data = await response.json();

      if (response.ok && data.success && data.user) {
        setUser(data.user);
        setIsAuthenticated(true);
        appDispatch({ type: 'SET_USER_ID', payload: data.user.id });
        // For new users, LOAD_STATE_FROM_API will likely fetch an empty state, which is fine.
        // AppLayout will then redirect to /list/create-first
        appDispatch({ type: 'LOAD_STATE_FROM_API', payload: { userId: data.user.id, currencyCode: appState.currency.code } });
        toast({ title: 'Sign Up Successful', description: 'Welcome! Your account has been created.' });
        router.push('/list/create-first');
        setIsLoading(false);
        return true;
      } else {
        toast({ title: 'Sign Up Failed', description: data.message || 'Could not create account.', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Sign up error:', error);
      toast({ title: 'Sign Up Error', description: 'An unexpected error occurred.', variant: 'destructive' });
    }
    setIsLoading(false);
    return false;
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await fetch(`${API_BASE_URL}/auth/logout.php`, { method: 'POST' });
    } catch (error) {
      console.error("Logout API call failed:", error);
      // Still proceed with client-side logout
    }
    setUser(null);
    setIsAuthenticated(false);
    appDispatch({ type: 'SET_USER_ID', payload: null });
    appDispatch({ type: 'RESET_APP_STATE_FOR_LOGOUT' }); // Clear user-specific data
    toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
    router.push('/auth');
    setIsLoading(false);
  };

  const contextValue = useMemo(() => ({
    isAuthenticated,
    user,
    isLoading,
    login,
    signup,
    logout,
  }), [isAuthenticated, user, isLoading, login, signup, logout]);

  return (
    <AuthContext.Provider value={contextValue}>
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
