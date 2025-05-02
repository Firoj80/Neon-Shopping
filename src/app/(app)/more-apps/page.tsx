
'use client'; // Needed for client-side redirect

import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react'; // Use a simple loader icon

export default function MoreAppsPage() {
  const developerLink = "https://play.google.com/store/apps/developer?id=Featured+Cool+Apps"; // Updated URL

  useEffect(() => {
    // Redirect immediately on the client-side after mount using standard web methods
    if (typeof window !== 'undefined') {
       window.location.href = developerLink;
       // Alternatively, open in a new tab:
       // window.open(developerLink, '_blank');
    }
  }, [developerLink]);


  // Show a simple loading indicator while redirecting
   return (
     <div className="flex flex-col items-center justify-center text-center min-h-[calc(100vh-10rem)] space-y-4 p-4">
        <Loader2 className="h-10 w-10 animate-spin text-secondary" />
        <p className="text-lg font-semibold text-neonText">Redirecting to Developer Page...</p>
         <p className="text-sm text-muted-foreground">
             If the redirect doesn't happen automatically, please click <a href={developerLink} target="_blank" rel="noopener noreferrer" className="text-secondary underline hover:text-secondary/80">here</a>.
         </p>
     </div>
   );
}
