
'use client'; // Needed for client-side redirect

import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react'; // Use a simple loader icon

export default function RatePage() {
  // Replace with your actual Play Store link
  const playStoreLink = "https://play.google.com/store/apps/details?id=com.firoj.neonshopping"; // Updated URL

  useEffect(() => {
    // Redirect immediately on the client-side after mount using standard web methods
    if (typeof window !== 'undefined') {
       window.location.href = playStoreLink;
       // Alternatively, open in a new tab:
       // window.open(playStoreLink, '_blank');
    }
  }, [playStoreLink]);

  // Show a simple loading indicator while redirecting
  return (
    <div className="flex flex-col items-center justify-center text-center min-h-[calc(100vh-10rem)] space-y-4 p-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-lg font-semibold text-neonText">Redirecting to Play Store...</p>
        <p className="text-sm text-muted-foreground">
            If the redirect doesn't happen automatically, please click <a href={playStoreLink} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80">here</a>.
        </p>
    </div>
  );
}
