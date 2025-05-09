"use client";

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppProvider } from '@/context/app-context';
// Removed AuthProvider import, it will be in layout.tsx

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
        <AppProvider> {/* AppProvider now handles core app state */}
            {/* AuthProvider removed from here */}
            {children}
        </AppProvider>
    </QueryClientProvider>
  );
}
