'use client'; // Needed for client-side redirect

import React, { useEffect } from 'react';
import { redirect } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton'; // For loading state


export default function MoreAppsPage() {
  const developerLink = "https://play.google.com/store/apps/developer?id=Featured+Cool+Apps"; // Updated URL

  useEffect(() => {
    // Redirect immediately on the client-side
    if (typeof window !== 'undefined') {
       window.location.href = developerLink;
    } else {
       // Server-side fallback (less likely to be hit directly)
       // Consider if a simple message is better than trying server redirect here
    }
  }, [developerLink]);


  // Show a loading indicator while redirecting
   return (
     <div className="space-y-6 flex flex-col items-center justify-center text-center min-h-[calc(100vh-15rem)]">
         <div className="max-w-md w-full p-6 bg-card border border-secondary/30 shadow-neon rounded-lg flex flex-col items-center gap-4">
             <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full mb-4" />
              <Skeleton className="h-10 w-1/2" />
              <p className="text-muted-foreground text-sm mt-4">Redirecting to Play Store...</p>
         </div>
     </div>
   );
}
