'use client';

import { GraphQLExample } from './components/ui/GraphQLExample';
import { LoginForm } from './components/ui/LoginForm';
import { useAuth } from './hooks/useAuth';
import { useState, useEffect } from 'react';
import { Box, Container, Typography, Paper, Button, Alert, AppBar, Toolbar } from '@mui/material';
import { ThemeToggle } from './components/ui/ThemeToggle';

export default function Home() {
  // useAuth uses Apollo hooks, so it must be called inside ApolloProvider
  // The provider is in layout.tsx, so this should work
  const { isAuthenticated, logout } = useAuth();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering auth-dependent UI after client-side mount
  useEffect(() => {
    // Mark component as mounted on client side to prevent hydration mismatch
    setMounted(true);
  }, []); // Empty deps: only run on mount to prevent hydration mismatch

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
      }}
    >
      {/* App Bar with Theme Toggle */}
      <AppBar position="static" elevation={0}>
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
              <Paper elevation={3} sx={{ p: 4 }}>
                <Typography variant="h5" component="h2" align="center" gutterBottom>
                  Welcome to Aletheia
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center">
                  Loading...
                </Typography>
              </Paper>
            ) : !isAuthenticated ? (
              <Paper elevation={3} sx={{ p: 4 }}>
                <Typography variant="h5" component="h2" align="center" gutterBottom>
                  Welcome to Aletheia
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
                  Please login to continue
                </Typography>
                <LoginForm />
              </Paper>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Authentication Status */}
                <Alert
                  severity="success"
                  action={
                    <Button color="inherit" size="small" onClick={logout}>
                      Logout
                    </Button>
                  }
                >
                  Status: Authenticated
                </Alert>

                {/* GraphQL Example */}
                <Paper elevation={1} sx={{ p: 3 }}>
                  <Typography variant="h6" component="h2" gutterBottom>
                    GraphQL Query Example
                  </Typography>
                  <GraphQLExample />
                </Paper>
              </Box>
            )}
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
