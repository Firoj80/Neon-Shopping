// src/app/page.tsx
"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context'; // Assuming path is correct
import { useAppContext } from '@/context/app-context'; // Assuming path is correct
import { useClientOnly } from '@/hooks/use-client-only';


// This page now acts primarily as an entry point.
// The core redirection logic is handled by AppLayoutContent and middleware.
export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authIsLoading } = useAuth();
  const { state: appState, isLoading: appIsLoading } = useAppContext();
  const isClientMounted = useClientOnly();

  useEffect(() => {
    if (!isClientMounted) return;

    const combinedIsLoading = authIsLoading || appIsLoading;
    if (combinedIsLoading) return; // Wait for auth and app data to load

    // Redirection logic is now primarily in AppLayoutContent
    // This useEffect can act as a final fallback or be simplified further
    // if AppLayoutContent robustly handles all scenarios.

    if (!isAuthenticated) {
      router.replace('/auth');
    } else {
      const userLists = appState.lists.filter(list => list.userId === appState.userId);
      if (userLists.length === 0) {
        router.replace('/list/create-first');
      } else {
        router.replace('/list');
      }
    }
  }, [isClientMounted, isAuthenticated, authIsLoading, appState.lists, appState.userId, appIsLoading, router]);

  // Display a minimal loader while initial checks and redirects happen.
  // AppLayoutContent will display a more comprehensive loader during its checks.
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-background text-center p-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
      <p className="text-primary text-sm font-medium">Initializing...</p>
    </div>
  );
}
