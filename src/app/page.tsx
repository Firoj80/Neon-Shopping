// src/app/page.tsx
"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
// Removed useAuth
import { useAppContext } from '@/context/app-context'; // useAppContext is still needed for list checks
import { useClientOnly } from '@/hooks/use-client-only';


export default function HomePage() {
  const router = useRouter();
  // Removed authIsLoading and isAuthenticated
  const { state: appState, isLoading: appIsLoading } = useAppContext();
  const isClientMounted = useClientOnly();

  useEffect(() => {
    if (!isClientMounted || appIsLoading) return; // Wait for client mount and app data to load

    // AppLayoutContent will now primarily handle this redirection.
    // This page can be a simple loading/entry point.
    // If AppLayoutContent correctly redirects, this might become redundant or simplified further.
    const userLists = appState.lists || []; // Ensure lists is an array
    if (userLists.length === 0) {
      router.replace('/list/create-first');
    } else {
      router.replace('/list');
    }

  }, [isClientMounted, appState.lists, appIsLoading, router]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-background text-center p-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
      <p className="text-primary text-sm font-medium">Loading Neon Shopping...</p>
    </div>
  );
}
