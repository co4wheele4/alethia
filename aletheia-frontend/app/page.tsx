'use client';

import { LoginForm } from './features/auth/components/LoginForm';
import { useAuth } from './features/auth/hooks/useAuth';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Container, Typography, Paper, AppBar, Toolbar } from '@mui/material';
import { ThemeToggle } from './components/primitives/ThemeToggle';

export default function Home() {
  // useAuth uses Apollo hooks, so it must be called inside ApolloProvider
  // The provider is in layout.tsx, so this should work
  const router = useRouter();
  const { isAuthenticated, isInitialized } = useAuth();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering auth-dependent UI after client-side mount
  useEffect(() => {
    // Defer state update to avoid synchronous setState in effect
    const rafId = requestAnimationFrame(() => {
      setMounted(true);
    });
    return () => cancelAnimationFrame(rafId);
  }, []); // Empty deps: only run on mount to prevent hydration mismatch

  // Redirect authenticated users to dashboard (only after auth state is initialized)
  useEffect(() => {
    if (mounted && isInitialized && isAuthenticated) {
      // Use replace instead of push to avoid adding to history
      router.replace('/dashboard');
    }
  }, [mounted, isInitialized, isAuthenticated, router]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      {/* App Bar with Theme Toggle */}
      <AppBar 
        position="static" 
        elevation={0}
        sx={{
          backgroundColor: 'background.paper',
          zIndex: 1,
        }}
        suppressHydrationWarning
      >
        <Toolbar sx={{ justifyContent: 'flex-end' }}>
          <ThemeToggle />
        </Toolbar>
      </AppBar>

      <Container
        maxWidth="md"
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            py: 8,
            px: 4,
          }}
        >
          <Box sx={{ textAlign: 'center', width: '100%' }}>
            <Typography variant="h3" component="h1" gutterBottom>
              Aletheia
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 520, mx: 'auto' }}>
              Sign in to inspect documents as immutable evidence, with explicit provenance and uncertainty.
            </Typography>
          </Box>

          <Box sx={{ width: '100%', maxWidth: 500 }}>
            {/* Login Form - Prominently Displayed */}
            {/* Only render auth-dependent content after client-side mount to prevent hydration mismatch */}
            {!mounted ? (
              <Paper 
                elevation={3} 
                sx={{ 
                  p: 4,
                }}
                suppressHydrationWarning
              >
                <Typography variant="h5" component="h2" align="center" gutterBottom>
                  Sign in
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center">
                  Loading...
                </Typography>
              </Paper>
            ) : !isAuthenticated ? (
              <Paper 
                elevation={3} 
                sx={{ 
                  p: 4,
                }}
                suppressHydrationWarning
              >
                <Typography variant="h5" component="h2" align="center" gutterBottom>
                  Sign in
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
                  Use your account credentials to continue.
                </Typography>
                <LoginForm />
              </Paper>
            ) : (
              // Authenticated users will be redirected to dashboard
              <Paper 
                elevation={3} 
                sx={{ 
                  p: 4,
                }}
                suppressHydrationWarning
              >
                <Typography variant="body2" color="text.secondary" align="center">
                  Redirecting to dashboard...
                </Typography>
              </Paper>
            )}
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
