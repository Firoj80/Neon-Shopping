// src/app/page.tsx
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useAppContext } from '@/context/app-context'; // Reverted to alias path

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { state: appState, isLoading: appLoading, dispatch } = useAppContext();

  useEffect(() => {
    if (!authLoading && !appLoading) {
      if (isAuthenticated && user) {
        // User is authenticated
        // Attempt to load data from API if user is authenticated and app_user_id exists
        if (user.id) { // Ensure user.id is available
          dispatch({ type: 'LOAD_STATE_FROM_API', payload: { userId: user.id, apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || '/api/php' }});
        }

        if (Array.isArray(appState.lists) && appState.lists.length > 0) {
          router.replace('/list'); // User has lists, go to main list page
        } else {
          // If lists are empty but it's not the initial load (e.g., after API call)
          // and not on create-first page, then redirect.
          if (pathname !== '/list/create-first') { // Add this check
            router.replace('/list/create-first'); // User has no lists, guide to create one
          }
        }
      } else {
        // User is not authenticated or user object is null
        // Only redirect if not already on the auth page
        if (pathname !== '/auth') { // Add this check
            router.replace('/auth'); // Redirect to login/signup page
        }
      }
    }
  }, [isAuthenticated, user, authLoading, appState.lists, appLoading, router, dispatch, pathname]); // Added pathname


  // Display a loading indicator while redirection logic is processing
  // This is important to prevent flashing content or incorrect redirects.
  if (authLoading || appLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="ml-4 text-primary text-sm">Loading Neon Shopping...</p>
      </div>
    );
  }
  
  // If execution reaches here, it means either redirection is about to happen or
  // it's the auth page itself. For non-auth pages, useEffect handles redirects.
  // For the auth page, it will render naturally.
  // It's generally safe to return null here if redirection is guaranteed by useEffect
  // or let the specific page component (like AuthPage or CreateFirstListPage) render.
  // For a generic landing page, a simple loader or null is fine if redirection is imminent.
  return null; 
}

// Helper to get current pathname, to avoid undefined errors during SSR with router.pathname
const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
