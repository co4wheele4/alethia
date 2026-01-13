'use client';

import { LoginForm } from './components/ui/LoginForm';
import { useAuth } from './hooks/useAuth';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Container, Typography, Paper, AppBar, Toolbar } from '@mui/material';
import { ThemeToggle } from './components/ui/ThemeToggle';

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
        // Background image layer
        '&::before': {
          content: '""',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'url(/images/aletheiabg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.15, // Muted effect - adjust this value to make more/less visible
          zIndex: 0,
          pointerEvents: 'none',
        },
        // Darkening overlay for better text readability
        '&::after': {
          content: '""',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: (theme) => 
            theme.palette.mode === 'dark' 
              ? 'rgba(0, 0, 0, 0.4)' 
              : 'rgba(255, 255, 255, 0.3)',
          zIndex: 0,
          pointerEvents: 'none',
        },
      }}
    >
      {/* App Bar with Theme Toggle */}
      <AppBar 
        position="static" 
        elevation={0}
        sx={{
          backgroundColor: (theme) => 
            theme.palette.mode === 'dark' 
              ? 'rgba(18, 18, 18, 0.8)' 
              : 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
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
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Frontend connected to GraphQL Backend
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
                  backgroundColor: (theme) => 
                    theme.palette.mode === 'dark' 
                      ? 'rgba(18, 18, 18, 0.85)' 
                      : 'rgba(255, 255, 255, 0.85)',
                  backdropFilter: 'blur(10px)',
                }}
                suppressHydrationWarning
              >
                <Typography variant="h5" component="h2" align="center" gutterBottom>
                  Welcome to Aletheia
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
                  backgroundColor: (theme) => 
                    theme.palette.mode === 'dark' 
                      ? 'rgba(18, 18, 18, 0.85)' 
                      : 'rgba(255, 255, 255, 0.85)',
                  backdropFilter: 'blur(10px)',
                }}
                suppressHydrationWarning
              >
                <Typography variant="h5" component="h2" align="center" gutterBottom>
                  Welcome to Aletheia
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
                  Please login to continue
                </Typography>
                <LoginForm />
              </Paper>
            ) : (
              // Authenticated users will be redirected to dashboard
              <Paper 
                elevation={3} 
                sx={{ 
                  p: 4,
                  backgroundColor: (theme) => 
                    theme.palette.mode === 'dark' 
                      ? 'rgba(18, 18, 18, 0.85)' 
                      : 'rgba(255, 255, 255, 0.85)',
                  backdropFilter: 'blur(10px)',
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
