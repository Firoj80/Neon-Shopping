"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/app-context';
import { themes as appThemes, type Theme as AppTheme } from '@/config/themes';
import { cn } from '@/lib/utils';
import { Palette } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function ThemesPage() {
  const { state, dispatch } = useAppContext();
  const { toast } = useToast();
  const router = useRouter();

  const handleThemeSelect = (themeId: string) => {
    dispatch({ type: 'SET_THEME', payload: themeId });
    const selectedTheme = appThemes.find(t => t.id === themeId);
    toast({
      title: "Theme Changed",
      description: `Switched to ${selectedTheme?.name || 'selected'} theme.`,
      className: "bg-primary/10 border-primary text-primary-foreground glow-border",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
          <Palette className="h-6 w-6" /> Select Theme
        </h1>
        <Button variant="outline" onClick={() => router.back()} className="glow-border-inner">
          Back to Settings
        </Button>
      </div>
      <Card className="bg-card border-secondary/30 shadow-neon glow-border">
        <CardHeader>
          <CardTitle className="text-secondary">Choose Your Style</CardTitle>
          <CardDescription className="text-muted-foreground">
            Select a theme to customize the look and feel of Neon Shopping. Changes are applied instantly.
          </CardDescription>
        </CardHeader>
        <CardContent className="glow-border-inner p-4 md:p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {appThemes.map((theme) => (
              <Button
                key={theme.id}
                variant="outline"
                className={cn(
                  "flex flex-col items-center justify-center p-3 h-28 md:h-32 rounded-lg border-2 transition-all duration-200 ease-in-out glow-border-inner",
                  state.theme === theme.id
                    ? "border-primary shadow-neon ring-2 ring-primary bg-primary/10"
                    : "border-muted-foreground/30 hover:border-secondary hover:bg-secondary/5"
                )}
                onClick={() => handleThemeSelect(theme.id)}
                style={{ borderColor: state.theme === theme.id ? theme.previewColor : undefined }}
              >
                <div
                  className="w-10 h-10 md:w-12 md:h-12 rounded-full mb-2 border border-foreground/20 shadow-md"
                  style={{ backgroundColor: theme.previewColor }}
                />
                <span className={cn(
                    "text-xs sm:text-sm text-center truncate w-full font-medium",
                     state.theme === theme.id ? "text-primary" : "text-muted-foreground group-hover:text-secondary"
                )}>
                  {theme.name}
                </span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
