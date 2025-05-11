// src/app/providers.tsx
"use client";

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppProvider } from '../context/app-context'; // Changed to relative path
import { AuthProvider } from '../context/auth-context'; // Changed to relative path

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
      <AuthProvider> {/* AuthProvider is outer */}
        <AppProvider> {/* AppProvider is inner and can consume AuthContext */}
          {children}
        </AppProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
