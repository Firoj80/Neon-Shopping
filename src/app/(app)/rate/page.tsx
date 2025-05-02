'use client'; // Needed for potential client-side redirect or interaction

import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, ExternalLink } from 'lucide-react';

export default function RatePage() {

  // Replace with your actual Play Store link
  const playStoreLink = "https://play.google.com/store/apps/details?id=YOUR_APP_PACKAGE_NAME";

  const handleRateClick = () => {
    if (typeof window !== 'undefined') {
      window.open(playStoreLink, '_blank', 'noopener,noreferrer');
    }
  };

   // Optional: Redirect immediately if preferred, but showing a page is better UX
   /*
   useEffect(() => {
     if (typeof window !== 'undefined') {
       window.location.href = playStoreLink;
     }
   }, [playStoreLink]);
   */


  return (
    <div className="space-y-6 flex flex-col items-center justify-center text-center min-h-[calc(100vh-15rem)]">
      <Card className="bg-card border-primary/30 shadow-neon max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-secondary flex items-center justify-center gap-2">
             <Star className="h-6 w-6" /> Rate Neon Shopping List {/* Updated App Name */}
           </CardTitle>
          <CardDescription className="text-muted-foreground">
            Enjoying the app? Your feedback helps us improve!
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
           <p className="text-neonText">
             Please take a moment to rate us on the Google Play Store.
           </p>
          <Button
            onClick={handleRateClick}
            className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-neon hover:shadow-lg hover:shadow-primary/50 transition-shadow w-full sm:w-auto"
          >
             Rate on Play Store <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
