"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/app-context';
import { themes, themeColors, defaultThemeId } from '@/config/themes';
import { CheckCircle, Palette, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function ThemesPage() {
  const { state, dispatch } = useAppContext();
  const currentThemeId = state.theme || defaultThemeId;
  // For local storage version, assume all themes are available (isPremium = true effectively)
  const isPremium = true; 
  const { toast } = useToast();

  const handleThemeChange = (themeId: string) => {
    // No premium check needed for local storage version as all themes are available
    dispatch({ type: 'SET_THEME', payload: themeId });
    toast({
        title: "Theme Applied!",
        description: `Switched to ${themes.find(t => t.id === themeId)?.name || 'selected'} theme.`,
    });
  };

  return (
    <div className="space-y-8 p-2 sm:p-4 md:p-6 max-w-5xl mx-auto">
      <header className="text-center space-y-2">
        <Palette className="h-12 w-12 text-primary mx-auto animate-pulse" />
        <h1 className="text-3xl sm:text-4xl font-bold text-primary">Choose Your Cyberpunk Theme</h1>
        <p className="text-lg text-muted-foreground">
          Personalize your Neon Shopping experience. Click a theme to apply it instantly.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {themes.map((theme) => {
          const isActive = theme.id === currentThemeId;
          // No premium lock for local storage version
          const colors = themeColors[theme.id] || themeColors[defaultThemeId];
          const getHslString = (variableName: string) => `hsl(${colors[variableName]})`;

          return (
            <Card
              key={theme.id}
              className={cn(
                "cursor-pointer transition-all duration-300 ease-in-out transform hover:scale-105 glow-border",
                isActive ? "ring-2 ring-offset-2 ring-offset-background ring-secondary shadow-neon-lg" : "hover:shadow-neon",
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
                </div>
                <CardDescription style={{ color: `hsl(${colors['--muted-foreground']})` }}>
                  Click to apply this theme.
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
                    )}
                    style={isActive ? {
                        backgroundColor: `hsl(${colors['--secondary']})`,
                        color: `hsl(${colors['--secondary-foreground']})`,
                        borderColor: `hsl(${colors['--secondary']})`
                    } : {
                        borderColor: `hsl(${colors['--primary']})`,
                        color: `hsl(${colors['--primary']})`
                    }}
                 >
                    {isActive ? 'Applied' : 'Apply Theme'}
                 </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
