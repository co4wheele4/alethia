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
  const theme = createTheme({
    palette: {
      mode,
      primary: {
        main: '#2563eb', // blue-600
      },
      secondary: {
        main: '#dc2626', // red-600
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          html: {
            // Let MUI own the base background so it matches the theme toggle.
            backgroundColor: mode === 'dark' ? '#0a0a0a' : '#ffffff',
            minHeight: '100vh',
          },
          body: {
            // Make body transparent so the background image layer is visible.
            backgroundColor: 'transparent',
            minHeight: '100vh',
            position: 'relative',
          },
          // Ensure app content stays above the background layer.
          'body > *': {
            position: 'relative',
            zIndex: 1,
          },
          // Global background image layer (does not affect content opacity)
          'body::before': {
            content: '""',
            position: 'fixed',
            inset: 0,
            backgroundImage: 'url("/images/aletheiabg.png")',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            backgroundSize: 'cover',
            opacity: 0.3,
            pointerEvents: 'none',
            zIndex: 0,
          },
        },
      },
    },
  });
  return theme;
}

function MuiThemeProviderInner({
  children,
}: {
  children: React.ReactNode;
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
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <MuiThemeProviderInner>{children}</MuiThemeProviderInner>
    </ThemeProvider>
  );
}
