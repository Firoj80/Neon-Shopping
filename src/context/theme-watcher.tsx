"use client";

import React, { useEffect, useContext } from 'react';
import { AppContext } from './app-context';
import { themes, defaultThemeId } from '@/config/themes'; // Import defaultThemeId

interface ThemeWatcherProps {
  children: React.ReactNode;
}

export const ThemeWatcher: React.FC<ThemeWatcherProps> = ({ children }) => {
  const context = useContext(AppContext);

  useEffect(() => {
    const htmlElement = document.documentElement;
    
    // Find the default theme object using defaultThemeId
    const defaultThemeObject = themes.find(t => t.id === defaultThemeId) || themes[0]; // Fallback to first theme if ID not found

    let themeIdToApply = defaultThemeObject.id; 

    if (context && context.state && context.state.theme) {
      // Check if the theme from context is a valid theme ID
      if (themes.some(t => t.id === context.state.theme)) {
        themeIdToApply = context.state.theme;
      } else {
        console.warn(`Theme ID "${context.state.theme}" from context is not a valid theme. Falling back to default.`);
      }
    }

    const themeToApply = themes.find(t => t.id === themeIdToApply) || defaultThemeObject;

    // Remove all other theme classes
    htmlElement.className.split(' ').forEach(cls => {
      if (cls.startsWith('theme-') && cls !== themeToApply.className) {
        htmlElement.classList.remove(cls);
      }
    });
    
    // Add the current theme class if it's not already present
    if (!htmlElement.classList.contains(themeToApply.className)) {
      htmlElement.classList.add(themeToApply.className);
    }

    // Ensure .dark class is always present as themes are dark mode variations
    if (!htmlElement.classList.contains('dark')) {
      htmlElement.classList.add('dark');
    }
  }, [context?.state?.theme]); // Re-run effect when the theme in context changes

  return <>{children}</>;
};