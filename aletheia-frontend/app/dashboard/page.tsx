/**
 * Dashboard Landing Page
 * Main landing page for authenticated users
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  AppBar,
  Toolbar,
} from '@mui/material';
import {
  Search as SearchIcon,
  AccountTree as AccountTreeIcon,
  Visibility as VisibilityIcon,
  Security as SecurityIcon,
  Psychology as PsychologyIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { SkeletonLoader } from '../components/ui/SkeletonLoader';
import { ChangePasswordForm } from '../components/ui/ChangePasswordForm';
import { AletheiaLayout } from '../components/layout';
import { ContentSurface } from '../components/layout';
import { SystemStatusPanel } from '../components/integrity';
import { TruthStateIndicator } from '../components/clarity';
import { ServerHeader } from '../components/layout/ServerHeader';

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isInitialized, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  // Track client-side mount and hydration completion
  useEffect(() => {
    // Defer state updates to avoid synchronous setState in effect
    let rafId2: number | null = null;
    const rafId1 = requestAnimationFrame(() => {
      setMounted(true);
      // Use requestAnimationFrame to ensure this runs after React hydration
      // and Emotion styles are injected. This prevents hydration mismatches.
      rafId2 = requestAnimationFrame(() => {
        // Double RAF to ensure it runs after all style injections
        requestAnimationFrame(() => {
          setIsHydrated(true);
        });
      });
    });

    return () => {
      cancelAnimationFrame(rafId1);
      if (rafId2 !== null) {
        cancelAnimationFrame(rafId2);
      }
    };
  }, []);

  // Redirect to home if not authenticated (only after auth state is initialized)
  useEffect(() => {
    if (mounted && isInitialized && !isAuthenticated) {
      // Use replace instead of push to avoid adding to history
      router.replace('/');
    }
  }, [mounted, isInitialized, isAuthenticated, router]);

  // Show skeleton loader until:
  // 1. Component is mounted on client
  // 2. Hydration is complete (Emotion styles injected)
  // 3. Auth state is initialized
  // 4. User is authenticated
  // This ensures consistent rendering between server and client
  if (!mounted || !isHydrated || !isInitialized || !isAuthenticated) {
    return <SkeletonLoader />;
  }

  const features = [
    {
      title: 'Truth Discovery',
      description: 'Explore structured knowledge with tree/graph views and progressive disclosure',
      icon: <AccountTreeIcon sx={{ fontSize: 40 }} />,
      color: 'primary',
    },
    {
      title: 'Clarity & Sense-Making',
      description: 'Understand why you see what you see with explainable AI and reasoning',
      icon: <VisibilityIcon sx={{ fontSize: 40 }} />,
      color: 'info',
    },
    {
      title: 'Integrity & Trust',
      description: 'Transparent confidence signals and error attribution',
      icon: <SecurityIcon sx={{ fontSize: 40 }} />,
      color: 'success',
    },
    {
      title: 'Semantic Search',
      description: 'Search with understanding - see why results match',
      icon: <SearchIcon sx={{ fontSize: 40 }} />,
      color: 'warning',
    },
    {
      title: 'User Agency',
      description: 'Override, compare, and resolve conflicts with full transparency',
      icon: <PsychologyIcon sx={{ fontSize: 40 }} />,
      color: 'secondary',
    },
    {
      title: 'Change History',
      description: 'Track changes over time with full audit trails',
      icon: <TimelineIcon sx={{ fontSize: 40 }} />,
      color: 'error',
    },
  ];

  return (
    <AletheiaLayout
      header={
        <AppBar position="static" elevation={0}>
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Typography variant="h6" component="div">
              <ServerHeader />
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button
                color="inherit"
                onClick={() => setChangePasswordOpen(true)}
                sx={{ textTransform: 'none' }}
              >
                Change Password
              </Button>
              <ThemeToggle />
              <Button color="inherit" onClick={logout}>
                Logout
              </Button>
            </Box>
          </Toolbar>
        </AppBar>
      }
    >
      <Box sx={{ py: 4 }}>
        {/* Welcome Section */}
        <Box sx={{ mb: 6, textAlign: 'center' }}>
          <Typography variant="h3" component="h1" gutterBottom>
            Welcome to Aletheia
          </Typography>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Truth Discovery Platform
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 2, maxWidth: 600, mx: 'auto' }}>
            Discover, understand, and verify truth with AI-powered tools designed for transparency,
            explainability, and user agency.
          </Typography>
        </Box>

        {/* System Status */}
        <Box sx={{ mb: 4 }}>
          <SystemStatusPanel status="healthy" message="All systems operational" />
        </Box>

        {/* Features Grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
            },
            gap: 3,
            mb: 4,
          }}
        >
          {features.map((feature, index) => (
            <Card
              key={index}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <Box
                  sx={{
                    color: `${feature.color}.main`,
                    mb: 2,
                    display: 'flex',
                    justifyContent: 'center',
                  }}
                >
                  {feature.icon}
                </Box>
                <Typography variant="h6" component="h3" gutterBottom>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {feature.description}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* Quick Actions */}
        <ContentSurface>
          <Typography variant="h5" gutterBottom>
            Quick Actions
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(4, 1fr)',
              },
              gap: 2,
              mt: 2,
            }}
          >
            <Button variant="outlined" fullWidth size="large">
              Explore Knowledge
            </Button>
            <Button variant="outlined" fullWidth size="large">
              Search
            </Button>
            <Button variant="outlined" fullWidth size="large">
              View History
            </Button>
            <Button variant="outlined" fullWidth size="large">
              Settings
            </Button>
          </Box>
        </ContentSurface>

        {/* Status Indicators Example */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Truth States
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TruthStateIndicator state="known" />
            <TruthStateIndicator state="inferred" />
            <TruthStateIndicator state="user-provided" />
            <TruthStateIndicator state="unverified" />
          </Box>
        </Box>
      </Box>

      {/* Change Password Dialog */}
      <ChangePasswordForm
        open={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
        onSuccess={() => {
          // Optionally show a success message or refresh user data
          console.log('Password changed successfully');
        }}
      />
    </AletheiaLayout>
  );
}
