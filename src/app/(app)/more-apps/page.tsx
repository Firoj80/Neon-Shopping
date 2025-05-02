
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Boxes, ExternalLink } from 'lucide-react'; // Example icon, added ExternalLink
import { Button } from '@/components/ui/button'; // Import Button

export default function MoreAppsPage() {
  // Replace with links to your other apps if available
  // const otherApps = [
  //   // { name: "CyberNote", description: "Neon-themed note-taking app.", link: "#" },
  //   // { name: "Pixel Runner", description: "Retro arcade runner.", link: "#" },
  // ];

  const developerLink = "https://play.google.com/store/apps/developer?id=Featured+Cool+Apps"; // Updated URL

  const handleOpenLink = () => {
    if (typeof window !== 'undefined') {
      window.open(developerLink, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary">More Apps by Featured Cool Apps</h1> {/* Updated Company Name */}
      <Card className="bg-card border-secondary/30 shadow-neon">
        <CardHeader>
          <CardTitle className="text-secondary flex items-center gap-2">
            <Boxes className="h-5 w-5" /> Explore Our Creations
          </CardTitle>
           <CardDescription className="text-muted-foreground pt-2">
                 Check out other applications from our developer account on the Google Play Store!
           </CardDescription>
        </CardHeader>
         <CardContent className="flex flex-col items-center gap-4">
           <p className="text-neonText text-center">
                Click the button below to view our developer page.
           </p>
           <Button
             onClick={handleOpenLink}
             className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-neon hover:shadow-lg hover:shadow-primary/50 transition-shadow w-full sm:w-auto"
           >
             View on Play Store <ExternalLink className="ml-2 h-4 w-4" />
           </Button>
         </CardContent>
      </Card>
    </div>
  );
}
