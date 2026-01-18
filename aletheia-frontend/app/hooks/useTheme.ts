'use client';

import React, { useState, useEffect, createContext, useContext, useMemo, useCallback } from 'react';

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
    /* v8 ignore start */
    if (typeof window !== 'undefined') {
      // Defer state updates to avoid synchronous setState in effect
      const rafId = requestAnimationFrame(() => {
        const stored = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode;
        if (stored && ['light', 'dark', 'system'].includes(stored)) {
          setThemeModeState(stored);
        }
        setIsInitialized(true);
      });
      return () => cancelAnimationFrame(rafId);
    }
    /* v8 ignore stop */
  }, []);

  useEffect(() => {
    // Only update theme after initialization to prevent hydration mismatch
    if (!isInitialized) return;

    // Set up media query listener for system theme changes (outside requestAnimationFrame)
    let mediaQuery: MediaQueryList | null = null;
    let handleChange: ((e: MediaQueryListEvent) => void) | null = null;

    /* v8 ignore start */
    if (themeMode === 'system' && typeof window !== 'undefined') {
      mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      handleChange = (e: MediaQueryListEvent) => {
        setActualTheme(e.matches ? 'dark' : 'light');
      };
      mediaQuery.addEventListener('change', handleChange);
    }
    /* v8 ignore stop */

    // Defer state updates to avoid synchronous setState in effect
    const rafId = requestAnimationFrame(() => {
      // Update actual theme based on mode
      /* v8 ignore start */
      if (themeMode === 'system') {
        // Use system preference
        if (mediaQuery) {
          setActualTheme(mediaQuery.matches ? 'dark' : 'light');
        }
      } else {
        setActualTheme(themeMode);
      }
      /* v8 ignore stop */
    });

    return () => {
      cancelAnimationFrame(rafId);
      /* v8 ignore start */
      if (mediaQuery && handleChange) {
        mediaQuery.removeEventListener('change', handleChange);
      }
      /* v8 ignore stop */
    };
  }, [themeMode, isInitialized]);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    /* v8 ignore start */
    if (typeof window !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
    }
    /* v8 ignore stop */
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeModeState((currentMode) => {
      if (currentMode === 'light') {
        const newMode = 'dark';
        /* v8 ignore start */
        if (typeof window !== 'undefined') {
          localStorage.setItem(THEME_STORAGE_KEY, newMode);
        }
        /* v8 ignore stop */
        return newMode;
      } else if (currentMode === 'dark') {
        const newMode = 'system';
        /* v8 ignore start */
        if (typeof window !== 'undefined') {
          localStorage.setItem(THEME_STORAGE_KEY, newMode);
        }
        /* v8 ignore stop */
        return newMode;
      } else {
        const newMode = 'light';
        /* v8 ignore start */
        if (typeof window !== 'undefined') {
          localStorage.setItem(THEME_STORAGE_KEY, newMode);
        }
        /* v8 ignore stop */
        return newMode;
      }
    });
  }, []);

  const value = useMemo(
    () => ({
      themeMode,
      actualTheme,
      isInitialized,
      setThemeMode,
      toggleTheme,
    }),
    [themeMode, actualTheme, isInitialized, setThemeMode, toggleTheme],
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
