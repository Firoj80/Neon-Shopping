// src/app/page.tsx
"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/app-context';
import { useClientOnly } from '@/hooks/use-client-only'; // Assuming this hook exists

const CREATE_FIRST_LIST_ROUTE = '/list/create-first';
const DEFAULT_LIST_ROUTE = '/list';
// const AUTH_ROUTE = '/auth'; // Auth route no longer needed

export default function HomePage() {
  const router = useRouter();
  const { state: appState, isLoading: appIsLoading } = useAppContext();
  const isClientMounted = useClientOnly();

  useEffect(() => {
    if (!isClientMounted || appIsLoading) {
      return; // Wait for client mount and app data to load
    }

    // Logic for anonymous users (userId from AppContext)
    if (appState.userId) { // Check if anonymous userId is set
      const userLists = appState.lists.filter(list => list.userId === appState.userId);

      if (userLists.length === 0) {
        // If no lists for the anonymous user, redirect to create-first
        if (router && typeof router.replace === 'function' && window.location.pathname !== CREATE_FIRST_LIST_ROUTE) {
          console.log("HomePage: No lists for anonymous user, redirecting to create-first.");
          router.replace(CREATE_FIRST_LIST_ROUTE);
        }
      } else {
        // If lists exist for the anonymous user, redirect to the default list page
        if (router && typeof router.replace === 'function' && window.location.pathname !== DEFAULT_LIST_ROUTE) {
          console.log("HomePage: Anonymous user has lists, redirecting to /list.");
          router.replace(DEFAULT_LIST_ROUTE);
        }
      }
    } else {
      // This case should ideally not be hit if AppContext correctly assigns an anonymous ID on load.
      // If it is, it means userId is still null, possibly redirect to an error or wait.
      console.warn("HomePage: Anonymous user ID not yet available in AppContext.");
    }

  }, [isClientMounted, appIsLoading, appState.lists, appState.userId, router]);

  // Display a minimal loader while initial checks and redirects happen.
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-background text-center p-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
      <p className="text-primary text-sm font-medium">Loading Neon Shopping...</p>
    </div>
  );
}
