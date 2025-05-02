
"use client";

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// Removed ReactQueryDevtools import
import { AppProvider } from '@/context/app-context'; // Assuming context is created here

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  // Removed isClient state as it was only used for Devtools

  // No longer need useEffect for Devtools initialization

  return (
    <QueryClientProvider client={queryClient}>
        <AppProvider>
            {children}
            {/* Removed ReactQueryDevtools rendering logic */}
            {/* {isClient && <ReactQueryDevtools initialIsOpen={false} />} */}
        </AppProvider>
    </QueryClientProvider>
  );
}

