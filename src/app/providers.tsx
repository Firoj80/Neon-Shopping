
"use client";

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppProvider } from '@/context/app-context'; // Reverted to alias path
// Removed AuthProvider import as it was deleted

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
         {/* Removed AuthProvider wrapper */}
         <AppProvider> {/* AppProvider handles core app state */}
             {children}
        </AppProvider>
    </QueryClientProvider>
  );
}
