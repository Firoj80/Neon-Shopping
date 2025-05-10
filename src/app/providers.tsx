// src/app/providers.tsx
"use client";

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppProvider } from '@/context/app-context'; // Use alias

// Removed AuthProvider import

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Global default query options
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider> {/* AppProvider remains */}
        {children}
      </AppProvider>
    </QueryClientProvider>
  );
}
