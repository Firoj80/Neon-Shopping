"use client";

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AppProvider } from '@/context/app-context'; // Assuming context is created here

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);


  return (
    <QueryClientProvider client={queryClient}>
        <AppProvider>
            {children}
            {isClient && <ReactQueryDevtools initialIsOpen={false} />}
        </AppProvider>
    </QueryClientProvider>
  );
}
