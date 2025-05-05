
"use client";

import React, { useEffect, useState } from 'react'; // Added useState
import { useAppContext } from './app-context';
import { defaultTheme } from '@/config/themes';

interface ThemeWatcherProps {
  // Pass ReactNode directly, ThemeWatcher will handle applying the class
  // to the <html> tag but doesn't need to pass the class name down explicitly
  // if the layout structure relies on the <html> class.
  children: React.ReactNode;
}

export const ThemeWatcher: React.FC<ThemeWatcherProps> = ({ children }) => {
  const { state, isLoading } = useAppContext(); // Get loading state
  const [isMounted, setIsMounted] = useState(false); // Track mount state

  // Determine theme ID safely, only after loading and mounting
  const themeId = (!isLoading && isMounted && state?.theme) ? state.theme : defaultTheme.id;
  const themeClassName = `theme-${themeId}`;

  useEffect(() => {
    setIsMounted(true); // Component has mounted
  }, []);

  // Effect to apply the theme class to the <html> element
  useEffect(() => {
    // Only run this effect if mounted to ensure client-side execution
    if (!isMounted || isLoading) return;

    const htmlElement = document.documentElement;
    // Remove previous theme classes
    let themeRemoved = false;
    htmlElement.className.split(' ').forEach(cls => {
      if (cls.startsWith('theme-') && cls !== themeClassName) {
        htmlElement.classList.remove(cls);
        themeRemoved = true;
      }
    });
    // Add the current theme class
    if (!htmlElement.classList.contains(themeClassName) || themeRemoved) {
      htmlElement.classList.add(themeClassName);
    }
    // Add the 'dark' class consistently if it's not already there
    if (!htmlElement.classList.contains('dark')) {
        htmlElement.classList.add('dark');
    }

  }, [themeClassName, isMounted, isLoading]); // Depend on themeClassName, mount status, and loading status

  // Render children directly. The theme class is applied to the <html> tag.
  return <>{children}</>;
};

