'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Box,
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
import { SkeletonLoader } from '../primitives/SkeletonLoader';
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
    let raf2: number | null = null;
    // Use globalThis to avoid ReferenceError in non-browser runtimes/tests.
    const raf =
      (globalThis as unknown as { requestAnimationFrame?: typeof requestAnimationFrame })
        .requestAnimationFrame ?? ((cb: FrameRequestCallback) => window.setTimeout(() => cb(performance.now()), 0));
    const caf =
      (globalThis as unknown as { cancelAnimationFrame?: typeof cancelAnimationFrame })
        .cancelAnimationFrame ?? ((id: number) => window.clearTimeout(id));

    const raf1 = raf(() => {
      setMounted(true);
      raf2 = raf(() => {
        // Double RAF to reduce hydration/style injection mismatch risk.
        raf(() => setIsHydrated(true));
      });
    });

    return () => {
      caf(raf1);
      if (raf2 !== null) caf(raf2);
    };
  }, []);

  return { mounted, isHydrated };
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
        { href: '/evidence', label: 'Evidence', description: 'Chunk-level inspection & comparison' },
        { href: '/claims', label: 'Claims', description: 'Read-only assertions (always grounded)' },
        { href: '/entities', label: 'Entities', description: 'Extracted mentions and relationships' },
        { href: '/questions', label: 'Questions', description: 'Gated workspace (claims must link to evidence)' },
        { href: '/provenance', label: 'Provenance', description: 'Auditability & transformation steps' },
      ],
    [navItems]
  );

  useEffect(() => {
    if (!requireAuth) return;
    if (mounted && isInitialized && !isAuthenticated) {
      router.replace('/');
    }
  }, [mounted, isInitialized, isAuthenticated, requireAuth, router]);

  if (!mounted || !isHydrated || (requireAuth && (!isInitialized || !isAuthenticated))) {
    return <SkeletonLoader />;
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

                {requireAuth ? <Divider /> : null}
                {requireAuth ? (
                  <MenuItem
                    onClick={() => {
                      closeNavMenu();
                      logout();
                    }}
                  >
                    <ListItemText primary="Logout" />
                  </MenuItem>
                ) : null}
              </MenuList>
            </Paper>
          </ClickAwayListener>
        </Popper>
      </Box>
    </ErrorBoundary>
  );
}

