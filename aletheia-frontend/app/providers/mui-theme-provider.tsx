'use client';

import { ThemeProvider as MuiThemeProviderComponent, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, useTheme } from '../hooks/useTheme';

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
  const { actualTheme } = useTheme();
  const theme = getTheme(actualTheme);

  return (
    <MuiThemeProviderComponent theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProviderComponent>
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
