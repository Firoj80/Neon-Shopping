// src/app/page.tsx
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useAppContext } from '@/context/app-context';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { state: appState, isLoading: appLoading } = useAppContext();

  useEffect(() => {
    // Wait for both auth and app context to finish loading
    if (!authLoading && !appLoading) {
      if (isAuthenticated && user) { // Check for user object as well
        // User is authenticated
        if (Array.isArray(appState.lists) && appState.lists.length > 0) {
          router.replace('/list'); // User has lists, go to main list page
        } else {
          router.replace('/list/create-first'); // User has no lists, guide to create one
        }
      } else {
        // User is not authenticated or user object is null
        router.replace('/auth'); // Redirect to login/signup page
      }
    }
  }, [isAuthenticated, user, authLoading, appState.lists, appLoading, router]);

  // Display a loading indicator while redirection logic is processing
  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      <p className="ml-4 text-primary text-sm">Loading Neon Shopping...</p>
    </div>
  );
}
