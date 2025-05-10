"use client";

import React, { useEffect } from 'react';
import { useAppContext } from '@/context/app-context'; // Corrected: Import the hook
import { defaultThemeId } from '@/config/themes'; // Ensure defaultThemeId is correctly imported as string

interface ThemeWatcherProps {
  children: React.ReactNode;
}

export function ThemeWatcher({ children }: ThemeWatcherProps) {
  const { state } = useAppContext();
  const currentThemeId = state?.theme || defaultThemeId; // Use defaultThemeId if state.theme is not yet available

  useEffect(() => {
    if (typeof window !== 'undefined' && currentThemeId) {
      const htmlElement = document.documentElement;
      // Remove any existing theme classes
      htmlElement.className = htmlElement.className.replace(/\btheme-\S+/g, '');
      // Add the new theme class
      htmlElement.classList.add(`theme-${currentThemeId}`);
      console.log(`ThemeWatcher: Applied theme class: theme-${currentThemeId}`);
    }
  }, [currentThemeId]);

  return <>{children}</>;
}
