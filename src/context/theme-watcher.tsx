'use client';

import React, { useEffect } from 'react';
import { useAppContext } from '@/context/app-context'; // Changed to alias path
import { defaultThemeId } from '@/config/themes';

interface ThemeWatcherProps {
  children: React.ReactNode;
}

export const ThemeWatcher: React.FC<ThemeWatcherProps> = ({ children }) => {
  const context = useAppContext(); // Use the hook to get context

  useEffect(() => {
    // Ensure context and context.state are available before trying to access theme
    const themeId = context?.state?.theme || defaultThemeId;
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
