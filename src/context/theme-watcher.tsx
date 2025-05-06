
"use client";

import React, { useEffect, useState, useContext } from 'react';
import { AppContext } from './app-context'; // Assuming context is defined here
import { defaultTheme } from '@/config/themes';

interface ThemeWatcherProps {
  children: React.ReactNode; // Accept children directly
}

/**
 * A client component that watches the theme state from AppContext
 * and applies the corresponding theme class to the <html> element.
 */
export const ThemeWatcher: React.FC<ThemeWatcherProps> = ({ children }) => {
  const context = useContext(AppContext); // Use useContext with the imported AppContext
  const isLoading = context?.isLoading ?? true; // Handle context possibly being undefined initially
  const themeId = context?.state?.theme || defaultTheme.id; // Fallback to default if state or theme is undefined

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true); // Indicate component has mounted client-side
  }, []);

  // Effect to apply the theme class to the <html> element
  useEffect(() => {
    // Only run if mounted and context is loaded to ensure client-side execution
    if (!isMounted || isLoading) return;

    const themeClassName = `theme-${themeId}`;
    const htmlElement = document.documentElement;

    // Ensure 'dark' class is present first
    if (!htmlElement.classList.contains('dark')) {
      htmlElement.classList.add('dark');
    }

    // Remove previous theme classes if they differ from the current one
    let themeRemoved = false;
    htmlElement.className.split(' ').forEach(cls => {
      if (cls.startsWith('theme-') && cls !== themeClassName) {
        htmlElement.classList.remove(cls);
        themeRemoved = true;
      }
    });

    // Add the current theme class if it's not present or if another was removed
    if (!htmlElement.classList.contains(themeClassName) || themeRemoved) {
      console.log("Applying theme class:", themeClassName); // Debug log
      htmlElement.classList.add(themeClassName);
    } else {
      console.log("Theme class already applied:", themeClassName); // Debug log
    }

  }, [themeId, isMounted, isLoading]); // Re-run when themeId, mount status, or loading status changes

  // Render children directly. The theme class is applied to the <html> tag.
  return <>{children}</>;
};
