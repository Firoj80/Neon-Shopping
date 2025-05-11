"use client";

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppProvider } from '@/context/app-context'; // Use alias

// AuthProvider removed, will be in layout.tsx if specifically needed there

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
      <AppProvider>
        {/* <AuthProvider> AuthProvider removed from here */}
          {children}
        {/* </AuthProvider> */}
      </AppProvider>
    </QueryClientProvider>
  );
}
