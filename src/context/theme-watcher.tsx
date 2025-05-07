
"use client";

import React, { useEffect, useContext } from 'react';
import { AppContext } from './app-context'; // Assuming context is defined here
import { themes, defaultThemeId } from '@/config/themes';

interface ThemeWatcherProps {
  children: React.ReactNode;
}

/**
 * A client component that watches the theme state from AppContext
 * and applies the corresponding theme class to the <html> element.
 */
export const ThemeWatcher: React.FC<ThemeWatcherProps> = ({ children }) => {
  const context = useContext(AppContext);

  // Effect to apply the theme class to the <html> element
  useEffect(() => {
    if (!context) {
      // Apply default theme if context is not yet available
      // This might happen during initial server render before client hydration
      console.warn('AppContext not yet available in ThemeWatcher, applying default theme class.');
      const htmlElement = document.documentElement;
      const defaultTheme = themes.find(t => t.id === defaultThemeId);
      if (defaultTheme) {
        // Remove other theme classes
        themes.forEach(theme => {
          if (theme.className !== defaultTheme.className) {
            htmlElement.classList.remove(theme.className);
          }
        });
        if (!htmlElement.classList.contains(defaultTheme.className)) {
          htmlElement.classList.add(defaultTheme.className);
        }
      }
       // Ensure dark class is always present as themes are dark mode variations
      if (!htmlElement.classList.contains('dark')) {
        htmlElement.classList.add('dark');
      }
      return;
    }

    const { state } = context;
    const selectedThemeId = state?.theme || defaultThemeId;
    const selectedTheme = themes.find(t => t.id === selectedThemeId) || themes.find(t => t.id === defaultThemeId);

    if (selectedTheme) {
      const htmlElement = document.documentElement;
      // Remove all other theme classes first
      themes.forEach(theme => {
        if (theme.className !== selectedTheme.className) {
          htmlElement.classList.remove(theme.className);
        }
      });
      // Add the current theme class if it's not already present
      if (!htmlElement.classList.contains(selectedTheme.className)) {
        htmlElement.classList.add(selectedTheme.className);
      }
       // Ensure dark class is always present
      if (!htmlElement.classList.contains('dark')) {
         htmlElement.classList.add('dark');
      }
    }
  }, [context]); // Re-run when context (and thus state.theme) changes

  return <>{children}</>;
};
