"use client";

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppProvider } from '@/context/app-context';
import { AuthProvider } from '@/context/auth-context';

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
      <AuthProvider> {/* AuthProvider should wrap AppProvider if AppContext depends on AuthContext */}
        <AppProvider>
          {children}
        </AppProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
