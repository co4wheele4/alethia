'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AppBar, Box, Breadcrumbs, IconButton, Link as MuiLink, Stack, Toolbar, Typography } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';

import { ServerHeader } from '../layout/ServerHeader';
import { buildHeaderBreadcrumbs } from './header-breadcrumbs';

export interface HeaderProps {
  title: string;
  headerActions?: React.ReactNode;
  showMobileNavButton?: boolean;
  navMenuButtonId?: string;
  navMenuId?: string;
  navMenuOpen?: boolean;
  onOpenMobileNav?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

export function Header(props: HeaderProps) {
  const {
    title,
    headerActions,
    showMobileNavButton,
    navMenuButtonId,
    navMenuId,
    navMenuOpen,
    onOpenMobileNav,
  } = props;

  const pathname = usePathname() ?? '/';
  const breadcrumbs = useMemo(
    () => buildHeaderBreadcrumbs(pathname, title),
    [pathname, title],
  );

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        // Keep header clickable above Drawer/Backdrop.
        top: 0,
        left: 0,
        right: 0,
        zIndex: (theme) => theme.zIndex.modal + 10,
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, minWidth: 0, flex: 1 }}>
          {showMobileNavButton ? (
            <IconButton
              id={navMenuButtonId}
              aria-label="Open navigation"
              aria-haspopup="menu"
              aria-controls={navMenuOpen ? navMenuId : undefined}
              aria-expanded={navMenuOpen ? 'true' : undefined}
              onClick={(event) => onOpenMobileNav?.(event)}
              sx={{ mt: 0.25 }}
            >
              <MenuIcon />
            </IconButton>
          ) : null}
          <Stack spacing={0.25} sx={{ minWidth: 0, flex: 1 }}>
            <Breadcrumbs
              aria-label="Breadcrumb"
              separator="›"
              sx={{
                '& .MuiBreadcrumbs-separator': { mx: 0.25, color: 'text.disabled' },
                fontSize: (theme) => theme.typography.caption.fontSize,
                lineHeight: 1.2,
              }}
            >
              {breadcrumbs.map((c, idx) => {
                const last = idx === breadcrumbs.length - 1;
                if (c.href) {
                  return (
                    <MuiLink
                      key={`${idx}-${c.href}`}
                      component={Link}
                      href={c.href}
                      underline="hover"
                      color="inherit"
                      variant="caption"
                      fontWeight={last ? 600 : 400}
                      sx={{ lineHeight: 1.2 }}
                    >
                      {c.label}
                    </MuiLink>
                  );
                }
                return (
                  <Typography
                    key={`${idx}-${c.label}`}
                    component="span"
                    variant="caption"
                    color={last ? 'text.primary' : 'text.secondary'}
                    fontWeight={last ? 600 : 400}
                    sx={{ lineHeight: 1.2 }}
                  >
                    {c.label}
                  </Typography>
                );
              })}
            </Breadcrumbs>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, flexWrap: 'wrap' }}>
              <Typography variant="subtitle2" color="text.secondary">
                <ServerHeader />
              </Typography>
              <Typography
                variant="h6"
                component="div"
                data-testid="header-page-title"
                sx={{ lineHeight: 1.2 }}
              >
                {title}
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {headerActions}
          <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
            Nothing is asserted without evidence.
          </Typography>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

