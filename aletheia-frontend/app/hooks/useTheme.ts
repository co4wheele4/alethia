'use client';

import React, { useState, useEffect, createContext, useContext, useMemo } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

const THEME_STORAGE_KEY = 'aletheia_theme_preference';

interface ThemeContextType {
  themeMode: ThemeMode;
  actualTheme: 'light' | 'dark';
  isInitialized: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Always start with 'system' to match server render, then update from localStorage in useEffect
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');

  // Determine actual theme based on mode and system preference
  // Start with 'light' to match server render, then update in useEffect
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light');
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize theme from localStorage after mount (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode;
      if (stored && ['light', 'dark', 'system'].includes(stored)) {
        setThemeModeState(stored);
      }
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    // Only update theme after initialization to prevent hydration mismatch
    if (!isInitialized) return;

    // Update actual theme based on mode
    if (themeMode === 'system') {
      // Use system preference
      if (typeof window !== 'undefined') {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        setActualTheme(mediaQuery.matches ? 'dark' : 'light');

        // Listen for system theme changes
        const handleChange = (e: MediaQueryListEvent) => {
          setActualTheme(e.matches ? 'dark' : 'light');
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
      }
    } else {
      setActualTheme(themeMode);
    }
  }, [themeMode, isInitialized]);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
    }
  };

  const toggleTheme = () => {
    if (themeMode === 'light') {
      setThemeMode('dark');
    } else if (themeMode === 'dark') {
      setThemeMode('system');
    } else {
      setThemeMode('light');
    }
  };

  const value = useMemo(
    () => ({
      themeMode,
      actualTheme,
      isInitialized,
      setThemeMode,
      toggleTheme,
    }),
    [themeMode, actualTheme, isInitialized],
  );

  return React.createElement(ThemeContext.Provider, { value }, children);
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
