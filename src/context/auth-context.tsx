// src/context/auth-context.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
// import Cookies from 'js-cookie'; // js-cookie was removed
import { fetchFromApi } from '../lib/api';
import { useToast } from '../hooks/use-toast';
// Removed: import { useAppContext } from './app-context'; // This was causing circular dependency

export interface User {
  id: string;
  name: string;
  email: string;
  isPremium?: boolean; // isPremium status derived from subscription_status and expiry
  // These fields come from the PHP backend's user object
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
  const [isLoading, setIsLoading] = useState(true); // Start as true for initial session check
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  // Removed: const { dispatch: appDispatch } = useAppContext(); // Removed to break circular dependency

  const checkSession = useCallback(async (isInitialCheck = false) => {
    console.log("AuthContext: Checking session...");
    if (!isInitialCheck && isLoading) { // Only set loading if not initial check and already loading
      // This condition seems a bit off, usually initial check sets loading to true.
    } else if (isInitialCheck) {
        setIsLoading(true);
    }

    try {
      const response = await fetchFromApi('auth/session_status.php', { method: 'GET' });
      console.log("AuthContext: Session status response:", response);

      if (response && response.isAuthenticated && response.user) {
        const fetchedUser = response.user as User;
        setIsAuthenticated(true);
        setUser(fetchedUser);
        // AppContext will observe this change and dispatch SET_USER_CONTEXT_IN_APP
        console.log("AuthContext: User authenticated via session:", fetchedUser.id, "IsPremium:", fetchedUser.isPremium);
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
  }, [toast, isLoading, isAuthenticated]);

  useEffect(() => {
    checkSession(true); // Initial session check
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  const handleAuthSuccess = (loggedInUser: User, message: string, isSignUp: boolean = false) => {
    setIsAuthenticated(true);
    setUser(loggedInUser);
    // AppProvider will react to this state change
    console.log(`AuthContext: ${message} for user ${loggedInUser.id}. IsPremium: ${loggedInUser.isPremium}`);
    toast({ title: message, description: `Welcome ${loggedInUser.name}!` });

    // Redirect after successful login/signup
    // The redirection logic in AppLayoutContent or HomePage should handle where to go next
    // (e.g., to create-first-list or default list page)
    // We don't need to know list count here, AppContext and AppLayout will handle it.
    if (isSignUp) {
        router.push(CREATE_FIRST_LIST_ROUTE);
    } else {
        router.push(DEFAULT_AUTHENTICATED_ROUTE); // Or check if lists exist in AppContext logic
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await fetchFromApi('auth/login.php', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      console.log("AuthContext: Login API response:", response);
      if (response.success && response.user) {
        handleAuthSuccess(response.user as User, "Login Successful");
        return true;
      } else {
        toast({ title: "Login Failed", description: response.message || "Please check your credentials.", variant: "destructive" });
        setIsAuthenticated(false); // Ensure state reflects failure
        setUser(null);
        return false;
      }
    } catch (error: any) {
      toast({ title: "Login Error", description: error.message || "An error occurred.", variant: "destructive" });
      setIsAuthenticated(false);
      setUser(null);
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
      console.log("AuthContext: Signup API response:", response);
      if (response.success && response.user) {
        handleAuthSuccess(response.user as User, "Signup Successful", true);
        return true;
      } else {
        toast({ title: "Signup Failed", description: response.message || "Could not create account.", variant: "destructive" });
        setIsAuthenticated(false);
        setUser(null);
        return false;
      }
    } catch (error: any) {
      toast({ title: "Signup Error", description: error.message || "An error occurred.", variant: "destructive" });
      setIsAuthenticated(false);
      setUser(null);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    console.log("AuthContext: Logging out...");
    setIsLoading(true);
    try {
      await fetchFromApi('auth/logout.php', { method: 'POST' });
    } catch (error: any) {
      console.error("AuthContext: Logout API call failed, proceeding with client-side logout:", error.message);
    } finally {
      setIsAuthenticated(false);
      setUser(null);
      // AppProvider will observe this change and dispatch RESET_APP_STATE_FOR_LOGOUT
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      if (pathname !== AUTH_ROUTE) {
        router.push(AUTH_ROUTE);
      }
      setIsLoading(false);
      console.log("AuthContext: Logout finished.");
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, isLoading, login, signup, logout, checkSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextProps => {
  // console.log("useAuth called, context value:", useContext(AuthContext)); // Debug log
  const context = useContext(AuthContext);
  if (context === undefined) {
    console.error("useAuth error: AuthContext is undefined. Ensure AuthProvider wraps this component.");
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
