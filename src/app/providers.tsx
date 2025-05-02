
"use client";

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// Removed ReactQueryDevtools import
import { AppProvider } from '@/context/app-context'; // Assuming context is created here
// Removed SidebarProvider import

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  // Removed isClient state as it was only used for Devtools
  // Removed SidebarProvider wrapping

  return (
    <QueryClientProvider client={queryClient}>
        <AppProvider>
            {/* Removed SidebarProvider wrap */}
            {children}
            {/* Removed ReactQueryDevtools rendering logic */}
            {/* {isClient && <ReactQueryDevtools initialIsOpen={false} />} */}
        </AppProvider>
    </QueryClientProvider>
  );
}
