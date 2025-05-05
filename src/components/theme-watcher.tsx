'use client';

import {AppContext} from '@/context/app-context'; // Assuming this is where your context is defined
import React, {useEffect} from 'react';
import {themes, defaultTheme} from '@/config/themes';

interface ThemeWatcherProps {
  children: React.ReactNode; // Accept children directly
}

/**
 * A client component that watches the theme state from AppContext
 * and applies the corresponding theme class to the <html> element.
 */
export const ThemeWatcher: React.FC<ThemeWatcherProps> = ({children}) => {
  // Assuming useAppContext provides the theme state
  const context = React.useContext(AppContext);
  if (!context) {
    // Handle the case where context might be null/undefined, e.g., during initial render
    // You might return a loading state or default children
    console.warn('AppContext not yet available in ThemeWatcher');
    // Apply default theme class if context is not available
    useEffect(() => {
      const htmlElement = document.documentElement;
      const defaultThemeClassName = `theme-${defaultTheme.id}`;
      if (!htmlElement.classList.contains(defaultThemeClassName)) {
        // Remove other theme classes
        htmlElement.className.split(' ').forEach((cls) => {
          if (cls.startsWith('theme-')) {
            htmlElement.classList.remove(cls);
          }
        });
        htmlElement.classList.add(defaultThemeClassName);
      }
      // Ensure dark class is present
      if (!htmlElement.classList.contains('dark')) {
        htmlElement.classList.add('dark');
      }
    }, []);
    return <>{children}</>; // Render children even if context is not ready
  }

  const {state} = context;
  const themeId = state?.theme || defaultTheme.id; // Fallback to default
  const themeClassName = `theme-${themeId}`;

  // Effect to apply the theme class to the <html> element
  useEffect(() => {
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

    // Ensure dark class is present
    if (!htmlElement.classList.contains('dark')) {
      htmlElement.classList.add('dark');
    }
  }, [themeClassName]); // Depend on themeClassName

  // Render children directly
  return <>{children}</>;
};
