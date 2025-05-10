"use client";

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppProvider } from '@/context/app-context'; // Use alias

// Removed AuthProvider import, it's not used in this simpler version

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        {/* AuthProvider removed from here, AppLayout will handle auth context if needed by individual pages */}
        {children}
      </AppProvider>
    </QueryClientProvider>
  );
}
