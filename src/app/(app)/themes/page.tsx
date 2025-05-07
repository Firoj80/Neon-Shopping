
"use client";

import React from 'react';
import { useAppContext } from '@/context/app-context';
import { themes, type Theme } from '@/config/themes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ThemesPage() {
  const { state, dispatch } = useAppContext();

  const handleThemeChange = (themeId: string) => {
    dispatch({ type: 'SET_THEME', payload: themeId });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
        <Palette className="h-6 w-6" /> Select Theme
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {themes.map((theme: Theme) => (
          <Card
            key={theme.id}
            className={cn(
              "cursor-pointer transition-all duration-200 ease-in-out glow-border hover:shadow-neon-lg",
              state.theme === theme.id ? "border-primary ring-2 ring-primary shadow-neon-lg" : "border-border/30 hover:border-secondary/50"
            )}
            onClick={() => handleThemeChange(theme.id)}
          >
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-sm font-semibold text-secondary flex items-center justify-between">
                {theme.name}
                {state.theme === theme.id && <CheckCircle className="h-5 w-5 text-primary" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {/* Theme Preview Block */}
              <div className="h-16 rounded-md flex items-center justify-center gap-2 p-2"
                style={{
                  // Dynamically create a simplified preview based on theme colors
                  // This is a basic preview, more complex previews would require more logic
                  backgroundColor: `hsl(var(--card-bg-${theme.id}, var(--card)))`, // Fallback to current card
                  border: `2px solid hsl(var(--primary-bg-${theme.id}, var(--primary)))`,
                }}
              >
                 <div className="w-6 h-6 rounded-sm" style={{ backgroundColor: `hsl(var(--primary-bg-${theme.id}, var(--primary)))` }}></div>
                 <div className="w-6 h-6 rounded-sm" style={{ backgroundColor: `hsl(var(--secondary-bg-${theme.id}, var(--secondary)))` }}></div>
                 <div className="w-6 h-6 rounded-sm" style={{ backgroundColor: `hsl(var(--accent-bg-${theme.id}, var(--accent)))` }}></div>
              </div>
               <p className="text-xs text-muted-foreground mt-2 text-center">
                Click to apply this theme.
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
