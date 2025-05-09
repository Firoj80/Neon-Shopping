// src/app/page.tsx
"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useAppContext } from '../context/app-context'; // Ensure this path is correct
import { useClientOnly } from '@/hooks/use-client-only'; // Ensure this path is correct

// Define route constants for clarity
const AUTH_ROUTE = '/auth';
const CREATE_FIRST_LIST_ROUTE = '/list/create-first';
const DEFAULT_AUTHENTICATED_ROUTE = '/list';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authIsLoading } = useAuth();
  const { state: appState, isLoading: appIsLoading } = useAppContext();
  const isClientMounted = useClientOnly();

  const isLoading = authIsLoading || appIsLoading || !isClientMounted;

  useEffect(() => {
    // Redirection logic is now primarily handled by AppLayoutContent and middleware.
    // This useEffect can act as a final fallback or be simplified further if AppLayoutContent is robust.
    if (!isLoading && isClientMounted) {
      if (isAuthenticated) {
        const hasLists = Array.isArray(appState.lists) && appState.lists.length > 0;
        if (hasLists) {
          // If already on /list, no need to replace. If on /, AppLayoutContent will handle.
          if (router.pathname !== DEFAULT_AUTHENTICATED_ROUTE) { // Check current path before pushing
             // router.replace(DEFAULT_AUTHENTICATED_ROUTE);
          }
        } else {
           // If already on /list/create-first, no need to replace.
           if (router.pathname !== CREATE_FIRST_LIST_ROUTE) {
            // router.replace(CREATE_FIRST_LIST_ROUTE);
           }
        }
      } else {
         // If already on /auth, no need to replace.
         if (router.pathname !== AUTH_ROUTE) {
           // router.replace(AUTH_ROUTE);
         }
      }
    }
  }, [isLoading, isAuthenticated, appState.lists, router, isClientMounted]); // Added isClientMounted

  // Display a consistent loading screen.
  // Actual content or redirection will be handled by middleware or AppLayout.
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-background text-center p-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
      <p className="text-primary text-sm font-medium">Loading Neon Shopping...</p>
      <p className="text-xs text-muted-foreground mt-2">Initializing your cyberpunk experience.</p>
    </div>
  );
}
