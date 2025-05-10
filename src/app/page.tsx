
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/app-context';
import { ShoppingCart } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { state: appState, isLoading: appLoading } = useAppContext();

  useEffect(() => {
    // This effect will run once the component mounts and app state is available
    if (!appLoading && appState.isInitialDataLoaded) { // Check if initial data is loaded
      if (appState.lists && appState.lists.length > 0) {
        router.replace('/list'); // User has lists, go to list page
      } else {
        router.replace('/list/create-first'); // User has no lists, go to create first list page
      }
    }
  }, [appState.isInitialDataLoaded, appState.lists, appLoading, router]);

  // Show a loading spinner while determining the redirect
  return (
    <div className="flex items-center justify-center h-screen bg-background text-primary">
      <div className="flex flex-col items-center">
        <ShoppingCart className="w-16 h-16 animate-pulse text-primary" />
        <p className="mt-4 text-lg font-semibold">Initializing Neon Shopping...</p>
      </div>
    </div>
  );
}
