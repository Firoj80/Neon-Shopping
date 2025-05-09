// src/app/page.tsx
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useAppContext } from '@/context/app-context'; // Ensure this alias resolves correctly

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { state: appState, isLoading: appLoading, dispatch } = useAppContext();

  const currentPathname = typeof window !== 'undefined' ? window.location.pathname : '';

  useEffect(() => {
    if (!authLoading && !appLoading) {
      if (isAuthenticated && user) {
        // User is authenticated
        if (user.id && (!appState.userId || appState.userId !== user.id)) {
          // If user ID in auth context is different from app context, or app context has no user ID yet
          // This indicates a new login or a change in authenticated user
          console.log("HomePage: Authenticated user detected, loading data from API for user:", user.id);
          dispatch({ type: 'LOAD_STATE_FROM_API', payload: { userId: user.id, apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || '/api/php' }});
        }

        // Redirect based on lists after ensuring data for the current user is potentially loaded or being loaded
        // This check might need to be deferred until API data loading state is also considered
        if (Array.isArray(appState.lists) && appState.lists.length > 0) {
          if (currentPathname !== '/list' && currentPathname !== '/auth') { // Avoid redirecting if already on list or auth page processing
            router.replace('/list');
          }
        } else {
          // If authenticated but no lists, and not on create-first or auth page
          if (currentPathname !== '/list/create-first' && currentPathname !== '/auth') {
            router.replace('/list/create-first');
          }
        }
      } else {
        // User is not authenticated
        if (currentPathname !== '/auth') { // Avoid redirect loop if already on auth page
            router.replace('/auth');
        }
      }
    }
  }, [isAuthenticated, user, authLoading, appState.lists, appState.userId, appLoading, router, dispatch, currentPathname]);


  if (authLoading || appLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="ml-4 text-primary text-sm">Loading Neon Shopping...</p>
      </div>
    );
  }

  // If execution reaches here, it means redirection logic is being handled by useEffect,
  // or the user is on the /auth page (which renders its own content).
  // For a generic landing page, returning null is fine if redirection is imminent.
  return null;
}
