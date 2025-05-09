// src/app/page.tsx
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useAppContext } from '@/context/app-context';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authIsLoading, user } = useAuth();
  const { state: appState, isLoading: appLoading, dispatch } = useAppContext();

  // Middleware and AuthContext are now primarily responsible for redirection.
  // This page can act as a loading/entry point.

  useEffect(() => {
    // This effect is a fallback or for scenarios where middleware might not catch all cases
    // or if we need client-side logic after auth state is determined.
    if (!authIsLoading && !appLoading) {
      if (isAuthenticated) {
        // If authenticated, ensure user data is loaded and then redirect if necessary
        if (user && user.id && (!appState.userId || appState.userId !== user.id)) {
             console.log("HomePage: Authenticated user detected, dispatching LOAD_STATE_FROM_API for user:", user.id);
             dispatch({ type: 'LOAD_STATE_FROM_API', payload: { userId: user.id, apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || '/api' }});
        }
        // Further redirection (e.g., to /list or /list/create-first) is handled by AppLayout or middleware
        // based on list existence after data is loaded.
      } else {
        // If not authenticated, middleware should have redirected to /auth.
        // If somehow still here, force redirect.
        if (router && typeof window !== 'undefined' && window.location.pathname !== '/auth') {
            // console.log("HomePage: Not authenticated, forcing redirect to /auth");
            // router.replace('/auth');
        }
      }
    }
  }, [isAuthenticated, user, authIsLoading, appState.userId, appState.lists, appLoading, router, dispatch]);


  // Show a loading indicator while auth and app state are resolving.
  // The actual page content (or redirection) will be handled once state is clear.
  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      <p className="ml-4 text-primary text-sm">Loading Neon Shopping...</p>
    </div>
  );
}
