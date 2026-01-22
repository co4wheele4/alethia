'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Container, Drawer, Typography } from '@mui/material';

import { useAuth } from '../../features/auth/hooks/useAuth';
import { SkeletonLoader } from '../primitives/SkeletonLoader';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { PrimaryNav, type PrimaryNavItem } from './primary-nav/PrimaryNav';
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const toggleMobileNav = useCallback(() => setMobileNavOpen((current) => !current), []);
  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);

  const items: AppShellNavItem[] = useMemo(
    () =>
      navItems ?? [
        { href: '/dashboard', label: 'Overview', description: 'System entrypoint (non-interpretive)' },
        { href: '/documents', label: 'Documents', description: 'Immutable sources and chunks' },
        { href: '/evidence', label: 'Evidence', description: 'Chunk-level inspection & comparison' },
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
          onOpenMobileNav={toggleMobileNav}
          onLogout={requireAuth ? logout : undefined}
        />

        <Box component="main" sx={{ flex: 1, minWidth: 0, pt: { xs: '56px', sm: '64px' } }}>
          <Container maxWidth="lg" sx={{ py: 3 }}>
            {children}
          </Container>
        </Box>

        <Drawer
          open={mobileNavOpen}
          onClose={closeMobileNav}
          ModalProps={{ keepMounted: true }}
          // Primary navigation lives in the hamburger on all breakpoints.
          sx={{
            display: 'block',
            // Ensure drawer/backdrop start below the fixed header.
            '& .MuiDrawer-paper': {
              top: { xs: '56px', sm: '64px' },
              height: { xs: 'calc(100% - 56px)', sm: 'calc(100% - 64px)' },
            },
            '& .MuiBackdrop-root': {
              top: { xs: '56px', sm: '64px' },
              height: { xs: 'calc(100% - 56px)', sm: 'calc(100% - 64px)' },
            },
          }}
        >
          <PrimaryNav
            items={items}
            variant="drawer"
            ariaLabel="primary navigation"
            onNavigate={closeMobileNav}
            footer={
              <Typography variant="caption" color="text.secondary">
                Nothing is asserted without evidence.
              </Typography>
            }
          />
        </Drawer>
      </Box>
    </ErrorBoundary>
  );
}

