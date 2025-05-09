"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation'; // Use next/navigation for App Router
import { useAppContext } from './app-context';
import { useToast } from '@/hooks/use-toast';

// --- Configuration ---
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/php'; // PHP API Base URL

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextProps {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  signup: (name: string, email: string, pass: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Start with true
  const router = useRouter();
  const pathname = usePathname();
  const { dispatch: appDispatch, state: appState } = useAppContext();
  const { toast } = useToast();

  const checkSession = useCallback(async () => {
    console.log("AuthContext: checkSession initiated. Current pathname:", pathname);
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/session_status.php`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Cookies are typically sent automatically by the browser
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.isAuthenticated && data.user) {
          console.log("AuthContext: User session valid:", data.user);
          setUser(data.user);
          setIsAuthenticated(true);
          appDispatch({ type: 'SET_USER_ID', payload: data.user.id });
          // Data loading for authenticated user will be triggered by AppContext's useEffect
        } else {
          console.log("AuthContext: No active session found or invalid data from session_status.php.");
          setIsAuthenticated(false);
          setUser(null);
          appDispatch({ type: 'SET_USER_ID', payload: null });
        }
      } else {
        // Handle non-OK responses
        if (response.status === 404) {
          console.error(
            `AuthContext: Session check API endpoint not found (404). URL: ${API_BASE_URL}/auth/session_status.php. ` +
            "Please ensure your backend is correctly deployed and the API_BASE_URL is configured if not using the default."
          );
        } else {
          console.error(`AuthContext: Error checking session status - ${response.status} ${response.statusText}`);
        }
        setIsAuthenticated(false);
        setUser(null);
        appDispatch({ type: 'SET_USER_ID', payload: null });
      }
    } catch (error) {
      console.error("AuthContext: Error in checkSession fetch:", error);
      setIsAuthenticated(false);
      setUser(null);
      appDispatch({ type: 'SET_USER_ID', payload: null });
    } finally {
      setIsLoading(false);
      console.log("AuthContext: checkSession completed. isLoading:", false, "isAuthenticated:", isAuthenticated);
    }
  }, [appDispatch, isAuthenticated]); // Removed pathname, appState.currency.code as direct dependencies, session check should be independent of these for initial load

  useEffect(() => {
    // Run session check once on mount
    checkSession();
  }, [checkSession]);


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
        // AppContext will then load data based on this new userId
        toast({ title: 'Login Successful', description: 'Welcome back!' });
        // Redirection will be handled by AppLayout or page useEffects
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
        // AppContext will then load data
        toast({ title: 'Sign Up Successful', description: 'Welcome! Your account has been created.' });
        // Redirection handled by AppLayout/page useEffects
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

  const logout = () => { // No need for async if just client-side changes now
    setIsLoading(true);
    fetch(`${API_BASE_URL}/auth/logout.php`, { method: 'POST' }) // Fire and forget logout to backend
      .catch(err => console.error("AuthContext: Error calling backend logout:", err));

    setUser(null);
    setIsAuthenticated(false);
    appDispatch({ type: 'RESET_APP_STATE_FOR_LOGOUT' }); // Clear user-specific data
    toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
    router.push('/auth'); // Explicitly redirect to auth page on logout
    setIsLoading(false);
  };

  const contextValue = useMemo(() => ({
    isAuthenticated,
    user,
    isLoading,
    login,
    signup,
    logout,
  }), [isAuthenticated, user, isLoading, login, signup, logout]); // Dependencies for useMemo

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