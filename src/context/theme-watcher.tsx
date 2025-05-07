
'use client';

import React, { useEffect, useContext } from 'react';
import { AppContext } from './app-context'; // Assuming context is defined here
import { defaultThemeId } from '@/config/themes'; // Ensure defaultThemeId is correctly imported as string

interface ThemeWatcherProps {
  children: React.ReactNode;
}

export const ThemeWatcher: React.FC<ThemeWatcherProps> = ({ children }) => {
  const context = useContext(AppContext);

  // Effect to apply the theme class to the <html> element
  useEffect(() => {
    const themeId = context?.state?.theme || defaultThemeId; // Fallback to defaultThemeId string
    const themeClassName = `theme-${themeId}`;
    const htmlElement = document.documentElement;

    // Remove previous theme classes
    let themeRemoved = false;
    htmlElement.className.split(' ').forEach((cls) => {
      if (cls.startsWith('theme-') && cls !== themeClassName) {
        htmlElement.classList.remove(cls);
        themeRemoved = true;
      }
    });

    // Add the current theme class if it's not already present or if another was removed
    if (!htmlElement.classList.contains(themeClassName) || themeRemoved) {
      htmlElement.classList.add(themeClassName);
    }

    // Ensure dark class is present (if your themes are dark by default)
    if (!htmlElement.classList.contains('dark')) {
      htmlElement.classList.add('dark');
    }
  }, [context?.state?.theme]); // Depend on theme from context

  return <>{children}</>;
};
