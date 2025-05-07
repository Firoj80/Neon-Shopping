"use client";

import React, { useEffect, useContext } from 'react';
import { AppContext } from './app-context';
import { themes, defaultThemeId } from '@/config/themes';

interface ThemeWatcherProps {
  children: React.ReactNode;
}

export const ThemeWatcher: React.FC<ThemeWatcherProps> = ({ children }) => {
  const context = useContext(AppContext);

  useEffect(() => {
    const htmlElement = document.documentElement;
    let themeToApplyId = defaultThemeId;

    if (context && context.state && context.state.theme) {
      themeToApplyId = context.state.theme;
    }

    const selectedTheme = themes.find(t => t.id === themeToApplyId) || themes.find(t => t.id === defaultThemeId);

    if (selectedTheme) {
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
    }

    // Ensure dark class is always present as themes are dark mode variations
    if (!htmlElement.classList.contains('dark')) {
      htmlElement.classList.add('dark');
    }
  }, [context]); // Re-run when context (and thus state.theme) changes

  return <>{children}</>;
};
