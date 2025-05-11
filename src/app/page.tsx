"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/app-context';
import { useClientOnly } from '@/hooks/use-client-only';

const CREATE_FIRST_LIST_ROUTE = '/list/create-first';
const DEFAULT_LIST_ROUTE = '/list';

export default function HomePage() {
  const router = useRouter();
  const { state: appState, isLoading: appIsLoading } = useAppContext();
  const isClientMounted = useClientOnly();

  useEffect(() => {
    if (!isClientMounted || appIsLoading) {
      return; // Wait for client mount and app data to load
    }

    // Check for lists associated with the current anonymous user
    const userLists = appState.lists.filter(list => list.userId === appState.userId);

    if (userLists.length === 0) {
      if (router && typeof router.replace === 'function' && window.location.pathname !== CREATE_FIRST_LIST_ROUTE) {
        router.replace(CREATE_FIRST_LIST_ROUTE);
      }
    } else {
      if (router && typeof router.replace === 'function' && window.location.pathname !== DEFAULT_LIST_ROUTE) {
        router.replace(DEFAULT_LIST_ROUTE);
      }
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
