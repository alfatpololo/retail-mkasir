'use client';

import { useEffect } from 'react';
import { getCurrentTheme, applyTheme } from '@/utils/theme';

/**
 * Global Theme Provider - Loads and applies theme on app start
 * This ensures theme is applied across all pages
 * Also listens for theme changes and applies them globally
 */
export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Load and apply theme when app starts
    const currentTheme = getCurrentTheme();
    applyTheme(currentTheme.id);

    // Listen for theme changes from localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'mkasir_theme' && e.newValue) {
        try {
          const themeId = JSON.parse(e.newValue);
          applyTheme(themeId);
        } catch (error) {
          console.error('Error applying theme from storage event:', error);
        }
      }
    };

    // Listen for custom theme change event (when theme is changed programmatically)
    const handleThemeChange = (e: CustomEvent<string>) => {
      applyTheme(e.detail);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('themechange', handleThemeChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('themechange', handleThemeChange as EventListener);
    };
  }, []);

  return <>{children}</>;
}

