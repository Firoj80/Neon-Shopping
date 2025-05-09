
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/app-context';
import { themes, themeColors, defaultThemeId } from '@/config/themes';
import { CheckCircle, Palette, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link'; // For linking to premium page
import { useToast } from '@/hooks/use-toast'; // For showing premium messages

export default function ThemesPage() {
  const { state, dispatch } = useAppContext();
  const currentThemeId = state.theme || defaultThemeId;
  const { isPremium } = state;
  const { toast } = useToast();

  const handleThemeChange = (themeId: string) => {
    if (!isPremium && themeId !== defaultThemeId) {
        toast({
            title: "Premium Theme",
            description: (
                <div className="flex flex-col gap-2">
                   <span>This theme is available for Premium users only.</span>
                   <Button asChild size="sm" className="mt-2 bg-secondary hover:bg-secondary/90 text-secondary-foreground">
                       <Link href="/premium">Upgrade to Premium</Link>
                   </Button>
                </div>
            ),
            variant: "default", // Use default for info, or destructive for more alert-like
        });
        return;
    }
    dispatch({ type: 'SET_THEME', payload: themeId });
  };

  return (
    <div className="space-y-8 p-2 sm:p-4 md:p-6 max-w-5xl mx-auto">
      <header className="text-center space-y-2">
        <Palette className="h-12 w-12 text-primary mx-auto animate-pulse" />
        <h1 className="text-3xl sm:text-4xl font-bold text-primary">Choose Your Cyberpunk Theme</h1>
        <p className="text-lg text-muted-foreground">
          Personalize your Neon Shopping experience. Click a theme to apply it instantly.
        </p>
        {!isPremium && (
            <p className="text-sm text-yellow-500">
                Some themes are Premium exclusives. <Button variant="link" asChild className="p-0 h-auto text-secondary hover:text-secondary/80 ml-1"><Link href="/premium">Upgrade Now!</Link></Button>
            </p>
        )}
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {themes.map((theme) => {
          const isActive = theme.id === currentThemeId;
          const isThemePremiumLocked = !isPremium && theme.id !== defaultThemeId;
          const colors = themeColors[theme.id] || themeColors[defaultThemeId];
          const getHslString = (variableName: string) => `hsl(${colors[variableName]})`;

          return (
            <Card
              key={theme.id}
              className={cn(
                "cursor-pointer transition-all duration-300 ease-in-out transform hover:scale-105 glow-border",
                isActive ? "ring-2 ring-offset-2 ring-offset-background ring-secondary shadow-neon-lg" : "hover:shadow-neon",
                isThemePremiumLocked && "opacity-70 cursor-not-allowed"
              )}
              onClick={() => handleThemeChange(theme.id)}
              style={{
                // @ts-ignore
                '--theme-card-bg': getHslString('--card'),
                '--theme-primary': getHslString('--primary'),
                '--theme-secondary': getHslString('--secondary'),
                '--theme-accent': getHslString('--accent'),
              }}
            >
              <CardHeader className="pb-3 pt-4 px-4 glow-border-inner" style={{ backgroundColor: `hsl(${colors['--card']})` }}>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg font-semibold" style={{ color: `hsl(${colors['--primary']})` }}>{theme.name}</CardTitle>
                  {isActive && <CheckCircle className="h-6 w-6 text-green-500" />}
                  {isThemePremiumLocked && <Lock className="h-5 w-5 text-yellow-400" />}
                </div>
                <CardDescription style={{ color: `hsl(${colors['--muted-foreground']})` }}>
                  {isThemePremiumLocked ? "Premium Only" : "Click to apply this theme."}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-3 glow-border-inner" style={{ backgroundColor: `hsl(${colors['--card']})` }}>
                <p className="text-xs" style={{ color: `hsl(${colors['--foreground']})` }}>Preview Colors:</p>
                <div className="flex space-x-2">
                  <div className="w-8 h-8 rounded-full border-2 border-border" style={{ backgroundColor: `hsl(${colors['--primary']})` }} title="Primary"></div>
                  <div className="w-8 h-8 rounded-full border-2 border-border" style={{ backgroundColor: `hsl(${colors['--secondary']})` }} title="Secondary"></div>
                  <div className="w-8 h-8 rounded-full border-2 border-border" style={{ backgroundColor: `hsl(${colors['--accent']})` }} title="Accent"></div>
                  <div className="w-8 h-8 rounded-full border-2 border-border" style={{ backgroundColor: `hsl(${colors['--background']})` }} title="Background"></div>
                </div>
                 <Button
                    variant={isActive ? "secondary" : "outline"}
                    size="sm"
                    className={cn(
                        "w-full mt-3 glow-border-inner",
                        isActive ? "bg-secondary text-secondary-foreground" : "border-primary text-primary hover:bg-primary/10",
                        isThemePremiumLocked && "bg-muted/50 border-muted-foreground/30 text-muted-foreground hover:bg-muted/50"
                    )}
                    style={isActive ? {
                        backgroundColor: `hsl(${colors['--secondary']})`,
                        color: `hsl(${colors['--secondary-foreground']})`,
                        borderColor: `hsl(${colors['--secondary']})`
                    } : isThemePremiumLocked ? {} : {
                        borderColor: `hsl(${colors['--primary']})`,
                        color: `hsl(${colors['--primary']})`
                    }}
                    disabled={isThemePremiumLocked && !isActive} // Disable if locked and not active
                 >
                    {isActive ? 'Applied' : isThemePremiumLocked ? 'Premium' : 'Apply Theme'}
                 </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
