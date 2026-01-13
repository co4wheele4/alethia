'use client';

import React, { useMemo } from 'react';
import { ThemeProvider as MuiThemeProviderComponent, createTheme } from '@mui/material/styles';
import { CacheProvider } from '@emotion/react';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, useTheme } from '../hooks/useTheme';
import createEmotionCache from '../lib/emotion-cache';

// Create emotion cache instance per request/component tree
// This ensures consistent cache between server and client
let emotionCache: ReturnType<typeof createEmotionCache> | null = null;

function getEmotionCache() {
  if (emotionCache === null) {
    emotionCache = createEmotionCache();
  }
  return emotionCache;
}

function getTheme(mode: 'light' | 'dark') {
  return createTheme({
    palette: {
      mode,
      primary: {
        main: '#2563eb', // blue-600
      },
      secondary: {
        main: '#dc2626', // red-600
      },
    },
  });
}

function MuiThemeProviderInner({
  children,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  children: any;
}) {
  const { actualTheme, isInitialized } = useTheme();
  
  // Only render theme-dependent content after initialization to prevent hydration mismatch
  // Use a consistent theme during SSR
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    // Defer state update to avoid synchronous setState in effect
    const rafId = requestAnimationFrame(() => {
      setMounted(true);
    });
    return () => cancelAnimationFrame(rafId);
  }, []);

  // During SSR and initial render, use light theme to match server
  // This ensures server and client render the same initial HTML
  const safeTheme = React.useMemo(
    () => (mounted && isInitialized ? getTheme(actualTheme) : getTheme('light')),
    [mounted, isInitialized, actualTheme]
  );

  // Use useMemo to ensure cache is consistent during render
  const cache = useMemo(() => getEmotionCache(), []);

  return (
    <CacheProvider value={cache}>
      <MuiThemeProviderComponent theme={safeTheme}>
        <CssBaseline />
        {children}
      </MuiThemeProviderComponent>
    </CacheProvider>
  );
}

export function MuiThemeProvider({
  children,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  children: any;
}) {
  return (
    <ThemeProvider>
      <MuiThemeProviderInner>{children}</MuiThemeProviderInner>
    </ThemeProvider>
  );
}
