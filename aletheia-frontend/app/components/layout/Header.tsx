'use client';

import React from 'react';
import { AppBar, Box, IconButton, Toolbar, Typography } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';

import { ServerHeader } from '../layout/ServerHeader';

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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
          {showMobileNavButton ? (
            <IconButton
              id={navMenuButtonId}
              aria-label="Open navigation"
              aria-haspopup="menu"
              aria-controls={navMenuOpen ? navMenuId : undefined}
              aria-expanded={navMenuOpen ? 'true' : undefined}
              onClick={(event) => onOpenMobileNav?.(event)}
            >
              <MenuIcon />
            </IconButton>
          ) : null}
          <Typography variant="subtitle2" color="text.secondary">
            <ServerHeader />
          </Typography>
          <Typography variant="h6" component="div" sx={{ lineHeight: 1.2 }}>
            {title}
          </Typography>
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

