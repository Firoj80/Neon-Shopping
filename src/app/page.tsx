// src/app/page.tsx
"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useClientOnly } from '@/hooks/use-client-only';
// Removed AuthContext and AppContext imports as redirection is primarily handled by AppLayoutContent

export default function HomePage() {
  const router = useRouter();
  const isClientMounted = useClientOnly();

  useEffect(() => {
    // Main redirection logic is handled by AppLayoutContent and middleware.
    // This page acts as an initial entry point that will be quickly redirected.
    // No complex logic needed here anymore.
    if (isClientMounted) {
      // AppLayoutContent should take over. If somehow user lands here and stays,
      // it might indicate an issue in the layout's redirection.
      // For safety, we can push to /auth, which will then be handled by AppLayoutContent.
      // router.replace('/auth'); // Fallback redirect, but ideally AppLayoutContent handles it.
    }
  }, [isClientMounted, router]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-background text-center p-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
      <p className="text-primary text-sm font-medium">Loading Neon Shopping...</p>
    </div>
  );
}
