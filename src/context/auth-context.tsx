// src/context/auth-context.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppContext } from './app-context';
import { useToast } from '@/hooks/use-toast';
import { fetchFromApi } from '@/lib/api'; // Import the new API helper

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
  checkSession: () => Promise<void>; // Make checkSession available if needed elsewhere
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { dispatch: appDispatch } = useAppContext(); // Removed appState to avoid circular dependency potential if AppContext depends on AuthContext
  const { toast } = useToast();

  const checkSession = useCallback(async () => {
    console.log("AuthContext: checkSession initiated. Current pathname:", pathname);
    setIsLoading(true);
    try {
      // This PHP endpoint should check session status (e.g., if $_SESSION['user_id'] is set)
      // and return user data if logged in.
      const data = await fetchFromApi('auth/session_status.php', { method: 'GET' });

      if (data.isAuthenticated && data.user) {
        console.log("AuthContext: User session valid:", data.user);
        setUser(data.user);
        setIsAuthenticated(true);
        appDispatch({ type: 'SET_USER_ID', payload: data.user.id });
        // AppContext will trigger data load for this user
      } else {
        console.log("AuthContext: No active session found or invalid data from session_status.php.");
        setIsAuthenticated(false);
        setUser(null);
        appDispatch({ type: 'SET_USER_ID', payload: null });
         // If not authenticated and not on auth page, redirect
        if (pathname !== '/auth') {
            // router.push('/auth'); // Redirect handled by middleware or AppLayout
        }
      }
    } catch (error: any) {
      console.error("AuthContext: Error in checkSession fetch:", error.message);
      setIsAuthenticated(false);
      setUser(null);
      appDispatch({ type: 'SET_USER_ID', payload: null });
      if (pathname !== '/auth' && error.message.includes("401")) { // Example: redirect on auth error if not on auth page
        // router.push('/auth'); // Redirect handled by middleware or AppLayout
      }
    } finally {
      setIsLoading(false);
      console.log("AuthContext: checkSession completed. isLoading:", false, "isAuthenticated:", isAuthenticated);
    }
  }, [appDispatch, pathname, router, isAuthenticated]); // Added isAuthenticated to re-evaluate if needed

  useEffect(() => {
    checkSession();
  }, [checkSession]); // Run checkSession on mount

  const login = async (email: string, pass: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const data = await fetchFromApi('auth/login.php', {
        method: 'POST',
        body: JSON.stringify({ email, password: pass }),
      });

      if (data.success && data.user) {
        setUser(data.user);
        setIsAuthenticated(true);
        appDispatch({ type: 'SET_USER_ID', payload: data.user.id });
        toast({ title: 'Login Successful', description: 'Welcome back!' });
        router.push('/list/create-first'); // Redirect after successful login
        return true;
      } else {
        toast({ title: 'Login Failed', description: data.message || 'Invalid email or password.', variant: 'destructive' });
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast({ title: 'Login Error', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
    return false;
  };

  const signup = async (name: string, email: string, pass: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const data = await fetchFromApi('auth/register.php', {
        method: 'POST',
        body: JSON.stringify({ name, email, password: pass }),
      });

      if (data.success && data.user) {
        setUser(data.user);
        setIsAuthenticated(true);
        appDispatch({ type: 'SET_USER_ID', payload: data.user.id });
        toast({ title: 'Sign Up Successful', description: 'Welcome! Your account has been created.' });
        router.push('/list/create-first'); // Redirect after successful signup
        return true;
      } else {
        toast({ title: 'Sign Up Failed', description: data.message || 'Could not create account.', variant: 'destructive' });
      }
    } catch (error: any) {
      console.error('Sign up error:', error);
      toast({ title: 'Sign Up Error', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
    return false;
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await fetchFromApi('auth/logout.php', { method: 'POST' });
    } catch (error) {
      console.error("AuthContext: Error calling backend logout:", error);
      // Proceed with client-side logout even if backend call fails
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      appDispatch({ type: 'RESET_APP_STATE_FOR_LOGOUT' });
      toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
      router.push('/auth');
      setIsLoading(false);
    }
  };

  const contextValue = useMemo(() => ({
    isAuthenticated,
    user,
    isLoading,
    login,
    signup,
    logout,
    checkSession, // Expose checkSession
  }), [isAuthenticated, user, isLoading, login, signup, logout, checkSession]);

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
