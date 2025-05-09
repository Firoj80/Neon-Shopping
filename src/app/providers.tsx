"use client";

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppProvider } from '@/context/app-context'; // Ensure alias resolves correctly
import { AuthProvider } from '@/context/auth-context'; // Keep AuthProvider separate

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
      <AppProvider> {/* AppProvider now wraps AuthProvider */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </AppProvider>
    </QueryClientProvider>
  );
}
