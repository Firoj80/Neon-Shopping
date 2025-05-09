
"use client";

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppProvider } from '@/context/app-context'; // Reverted to alias path
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
         <AuthProvider> {/* AuthProvider should wrap AppProvider if App depends on auth */}
             <AppProvider> {/* AppProvider handles core app state */}
                 {children}
            </AppProvider>
         </AuthProvider>
    </QueryClientProvider>
  );
}
