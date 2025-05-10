// src/context/auth-context.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { fetchFromApi } from '../lib/api';
import { useToast } from '../hooks/use-toast';

export interface User {
  id: string;
  name: string;
  email: string;
  isPremium?: boolean;
  subscription_status?: 'free' | 'premium';
  subscription_expiry_date?: string | null;
}

interface AuthContextProps {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkSession: (isInitialCheck?: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

const AUTH_ROUTE = '/auth';
const CREATE_FIRST_LIST_ROUTE = '/list/create-first';
const DEFAULT_AUTHENTICATED_ROUTE = '/list';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const checkSession = useCallback(async (isInitialCheck = false) => {
    console.log("AuthContext: Checking session...");
    if (!isInitialCheck || isLoading) setIsLoading(true); // Ensure loading is true during checks

    try {
      const response = await fetchFromApi('auth/session_status.php', { method: 'GET' });
      console.log("AuthContext: Session status response:", response);

      if (response && response.isAuthenticated && response.user) {
        const fetchedUser = response.user as User;
        setIsAuthenticated(true);
        setUser(fetchedUser);
        // AppContext will now observe this change and dispatch SET_USER_ID & SET_PREMIUM_STATUS
        console.log("AuthContext: User authenticated via session:", fetchedUser.id);
      } else {
        console.log("AuthContext: No active session. Message:", response?.message);
        setIsAuthenticated(false);
        setUser(null);
        // AppContext will observe this and reset its state
      }
    } catch (error: any) {
      console.error("AuthContext: Error checking session status -", error.message);
      setIsAuthenticated(false);
      setUser(null);
      // AppContext will observe this
    } finally {
      setIsLoading(false);
      console.log("AuthContext: Session check finished. isLoading:", false, "isAuthenticated (after check):", isAuthenticated);
    }
  }, [toast, isLoading, isAuthenticated]); // isAuthenticated for logging comparison

  useEffect(() => {
    checkSession(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Initial check only

  const handleAuthSuccess = (loggedInUser: User, message: string) => {
    setIsAuthenticated(true);
    setUser(loggedInUser);
    toast({ title: message, description: `Welcome ${loggedInUser.name}!` });
    // AppProvider will react to this state change and trigger data loading and redirection.
    // No direct appDispatch here.
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await fetchFromApi('auth/login.php', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (response.success && response.user) {
        handleAuthSuccess(response.user as User, "Login Successful");
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
        handleAuthSuccess(response.user as User, "Signup Successful");
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
    } catch (error) {
      console.error("Logout API call failed, proceeding with client-side logout:", error);
    } finally {
      setIsAuthenticated(false);
      setUser(null);
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      // AppProvider will react to isAuthenticated becoming false
      router.push(AUTH_ROUTE); // Redirect to auth page
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
