import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Boxes } from 'lucide-react'; // Example icon

export default function MoreAppsPage() {
  // Replace with links to your other apps if available
  const otherApps = [
    // { name: "CyberNote", description: "Neon-themed note-taking app.", link: "#" },
    // { name: "Pixel Runner", description: "Retro arcade runner.", link: "#" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary">More Apps by [Your Name/Company]</h1>
      <Card className="bg-card border-secondary/30 shadow-neon">
        <CardHeader>
          <CardTitle className="text-secondary flex items-center gap-2">
            <Boxes className="h-5 w-5" /> Explore Our Creations
          </CardTitle>
           {otherApps.length === 0 && (
               <CardDescription className="text-muted-foreground pt-2">
                 We're hard at work creating more tools and experiences. Check back later!
               </CardDescription>
            )}
        </CardHeader>
         {otherApps.length > 0 && (
            <CardContent className="space-y-4">
            {otherApps.map((app, index) => (
                <div key={index} className="p-3 border border-border/50 rounded-lg hover:bg-muted/10 transition-colors">
                <a href={app.link} target="_blank" rel="noopener noreferrer" className="block">
                    <h3 className="font-semibold text-neonText">{app.name}</h3>
                    <p className="text-sm text-muted-foreground">{app.description}</p>
                </a>
                </div>
            ))}
            </CardContent>
        )}
      </Card>
    </div>
  );
}
