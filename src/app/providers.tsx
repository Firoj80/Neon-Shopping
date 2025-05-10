// src/app/providers.tsx
"use client";

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppProvider } from '@/context/app-context'; // Use alias

// AuthProvider is removed as per request

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
        <AppProvider> {/* AppProvider is now the main provider */}
          {children}
        </AppProvider>
    </QueryClientProvider>
  );
}
