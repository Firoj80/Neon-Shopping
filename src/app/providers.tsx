
"use client";

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppProvider } from '@/context/app-context'; // Assuming context is created here

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  // Ensure children are treated as an array of React nodes
  // This might help if the structure passed down is causing issues.
  const validatedChildren = React.Children.toArray(children);

  return (
    <QueryClientProvider client={queryClient}>
        <AppProvider>
            {validatedChildren}
        </AppProvider>
    </QueryClientProvider>
  );
}
