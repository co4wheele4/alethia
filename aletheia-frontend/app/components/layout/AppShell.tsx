'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Box,
  Button,
  CircularProgress,
  ClickAwayListener,
  Container,
  Divider,
  ListItemText,
  MenuItem,
  MenuList,
  Paper,
  Popper,
  Typography,
} from '@mui/material';

import { useAuth } from '../../features/auth/hooks/useAuth';
import { ThemeToggle } from '../primitives/ThemeToggle';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { type PrimaryNavItem } from './primary-nav/PrimaryNav';
import { Header } from './Header';

export type AppShellNavItem = PrimaryNavItem;

export interface AppShellProps {
  title: string;
  children: React.ReactNode;
  navItems?: AppShellNavItem[];
  headerActions?: React.ReactNode;
  /**
   * If true, user must be authenticated to render children.
   * When unauthenticated we redirect to `/`.
   */
  requireAuth?: boolean;
}

function useClientReady() {
  const [mounted, setMounted] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const t = window.setTimeout(() => {
      if (cancelled) return;
      setMounted(true);
      setIsHydrated(true);
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, []);

  return { mounted, isHydrated };
}

function CenteredDevGate(props: { message: string }) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        p: 3,
      }}
    >
      <CircularProgress size={28} aria-label="Loading" />
      <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ maxWidth: 420 }}>
        {props.message}
      </Typography>
    </Box>
  );
}

export function AppShell(props: AppShellProps) {
  const { title, children, navItems, headerActions, requireAuth = true } = props;
  const router = useRouter();
  const { isAuthenticated, isInitialized, logout } = useAuth();
  const { mounted, isHydrated } = useClientReady();
  const [navAnchorEl, setNavAnchorEl] = useState<HTMLButtonElement | null>(null);
  const navOpen = Boolean(navAnchorEl);
  const navMenuId = 'primary-nav-menu';
  const navMenuButtonId = 'primary-nav-button';

  const toggleNavMenu = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setNavAnchorEl((current) => (current ? null : event.currentTarget));
  }, []);

  const closeNavMenu = useCallback(() => setNavAnchorEl(null), []);
  const onMenuItemClick = useCallback(() => closeNavMenu(), [closeNavMenu]);

  const items: AppShellNavItem[] = useMemo(
    () =>
      navItems ?? [
        { href: '/dashboard', label: 'Overview', description: 'System entrypoint (non-interpretive)' },
        { href: '/documents', label: 'Documents', description: 'Immutable sources and chunks' },
        { href: '/search', label: 'Search', description: 'Non-semantic claim search (ADR-033)' },
        { href: '/evidence', label: 'Evidence', description: 'Chunk-level inspection & comparison' },
        { href: '/claims', label: 'Claims', description: 'Read-only assertions (always grounded)' },
        { href: '/claims/graph', label: 'Claim graph', description: 'Read-only claim–evidence topology (ADR-021)' },
        { href: '/review-queue', label: 'Review queue', description: 'Persisted review requests (coordination only)' },
        { href: '/entities', label: 'Entities', description: 'Extracted mentions and relationships' },
        { href: '/questions', label: 'Questions', description: 'Gated workspace (claims must link to evidence)' },
        { href: '/provenance', label: 'Provenance', description: 'Auditability & transformation steps' },
        {
          href: '/ingestion/html-crawl-runs',
          label: 'HTML crawl runs',
          description: 'Deterministic crawl audit (ADR-032)',
        },
      ],
    [navItems]
  );

  useEffect(() => {
    if (!requireAuth) return;
    if (mounted && isHydrated && isInitialized && !isAuthenticated) {
      router.replace('/');
    }
  }, [mounted, isHydrated, isInitialized, isAuthenticated, requireAuth, router]);

  if (!mounted || !isHydrated) {
    return <CenteredDevGate message="Preparing the app…" />;
  }

  if (requireAuth && !isInitialized) {
    return <CenteredDevGate message="Checking sign-in…" />;
  }

  if (requireAuth && isInitialized && !isAuthenticated) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          p: 3,
        }}
      >
        <Typography variant="h6" textAlign="center">
          Sign in required
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ maxWidth: 480 }}>
          This page needs an authenticated session. You are being redirected to the sign-in screen.
        </Typography>
        <Button component={Link} href="/" variant="contained">
          Go to sign in
        </Button>
      </Box>
    );
  }

  return (
    <ErrorBoundary>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header
          title={title}
          headerActions={headerActions}
          showMobileNavButton
          navMenuButtonId={navMenuButtonId}
          navMenuId={navMenuId}
          navMenuOpen={navOpen}
          onOpenMobileNav={toggleNavMenu}
        />

        <Box component="main" sx={{ flex: 1, minWidth: 0, pt: { xs: '56px', sm: '64px' } }}>
          <Container maxWidth="lg" sx={{ py: 3 }}>
            {children}
          </Container>
        </Box>

        <Popper
          id={navOpen ? navMenuId : undefined}
          open={navOpen}
          anchorEl={navAnchorEl}
          placement="bottom-start"
          disablePortal
          sx={{
            zIndex: (theme) => theme.zIndex.modal + 5,
            mt: 1,
          }}
        >
          <ClickAwayListener onClickAway={closeNavMenu}>
            <Paper
              elevation={6}
              sx={{
                minWidth: 320,
                maxWidth: 420,
                // Match the nav surface treatment.
                border: '1px solid currentColor',
                borderColor: 'divider',
              }}
            >
              <MenuList
                aria-label="Primary navigation"
                autoFocusItem={navOpen}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    event.preventDefault();
                    closeNavMenu();
                  }
                }}
              >
                {items.map((item) => (
                  <MenuItem
                    key={item.href}
                    component={Link}
                    href={item.href}
                    onClick={onMenuItemClick}
                  >
                    <ListItemText
                      primary={item.label}
                      secondary={item.description}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </MenuItem>
                ))}

                <Divider />

                <MenuItem disableGutters sx={{ px: 2, py: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <Typography variant="body2" color="text.secondary">
                      Theme
                    </Typography>
                    <ThemeToggle />
                  </Box>
                </MenuItem>

                {isAuthenticated ? (
                  [
                    <Divider key="logout-divider" />,
                    <MenuItem
                      key="logout"
                      onClick={() => {
                        closeNavMenu();
                        logout();
                      }}
                    >
                      <ListItemText primary="Logout" />
                    </MenuItem>,
                  ]
                ) : null}
              </MenuList>
            </Paper>
          </ClickAwayListener>
        </Popper>
      </Box>
    </ErrorBoundary>
  );
}

