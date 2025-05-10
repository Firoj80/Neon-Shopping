"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useAppContext } from '@/context/app-context';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { state: appState, isLoading: appLoading } = useAppContext();

  useEffect(() => {
    if (!authLoading && !appLoading) {
      if (isAuthenticated) {
        if (appState.lists && appState.lists.length > 0) {
          router.replace('/list');
        } else {
          router.replace('/list/create-first');
        }
      } else {
        router.replace('/auth');
      }
    }
  }, [isAuthenticated, authLoading, appState.lists, appLoading, router]);

  return (
    <div className="flex items-center justify-center h-screen bg-background text-primary">
      <div className="flex flex-col items-center">
        <svg className="animate-spin h-16 w-16 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="mt-4 text-lg font-semibold">Loading Neon Shopping...</p>
      </div>
    </div>
  );
}
