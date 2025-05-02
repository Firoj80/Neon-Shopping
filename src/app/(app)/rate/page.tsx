'use client'; // Needed for client-side redirect

import React, { useEffect } from 'react';
import { redirect } from 'next/navigation'; // Use Next.js redirect
import { Skeleton } from '@/components/ui/skeleton'; // For loading state

export default function RatePage() {
  // Replace with your actual Play Store link
  const playStoreLink = "https://play.google.com/store/apps/details?id=com.firoj.neonshopping"; // Updated URL

  useEffect(() => {
    // Redirect immediately on the client-side
    if (typeof window !== 'undefined') {
       window.location.href = playStoreLink; // Use window location for external URL redirect
       // Optional: Use router.push(playStoreLink) if it handles external URLs, but window.location is safer
    } else {
        // Fallback for server-side rendering (though less likely for this page)
         // Using next/navigation redirect might not work reliably for external URLs here.
         // Best to rely on client-side JS for external redirects.
    }
  }, [playStoreLink]); // Dependency array includes the link

  // Show a loading indicator while redirecting
  return (
    <div className="space-y-6 flex flex-col items-center justify-center text-center min-h-[calc(100vh-15rem)]">
        <div className="max-w-md w-full p-6 bg-card border border-primary/30 shadow-neon rounded-lg flex flex-col items-center gap-4">
            <Skeleton className="h-6 w-3/4 mb-2" />
             <Skeleton className="h-4 w-full mb-4" />
             <Skeleton className="h-10 w-1/2" />
             <p className="text-muted-foreground text-sm mt-4">Redirecting to Play Store...</p>
        </div>
    </div>
  );
}
