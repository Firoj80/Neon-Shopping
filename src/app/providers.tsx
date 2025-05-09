
"use client";

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppProvider } from '@/context/app-context'; // Use alias
// AuthProvider import removed as it's no longer used

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
        {/* AuthProvider removed from here */}
             <AppProvider> {/* AppProvider handles core app state */}
                 {children}
            </AppProvider>
    </QueryClientProvider>
  );
}
