// src/app/page.tsx
"use client"; // This page needs to be a client component for redirection logic

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useAppContext } from '@/context/app-context';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { state: appState, isLoading: appLoading } = useAppContext();

  useEffect(() => {
    // Wait for both auth and app context to finish loading
    if (!authLoading && !appLoading) {
      if (isAuthenticated) {
        // User is authenticated
        if (Array.isArray(appState.lists) && appState.lists.length > 0) {
          router.replace('/list'); // User has lists, go to main list page
        } else {
          router.replace('/list/create-first'); // User has no lists, guide to create one
        }
      } else {
        // User is not authenticated
        router.replace('/auth'); // Redirect to login/signup page
      }
    }
  }, [isAuthenticated, authLoading, appState.lists, appLoading, router]);

  // Display a loading indicator while redirection logic is processing
  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );
}
