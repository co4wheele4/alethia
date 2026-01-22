'use client';

import { AppBar, Box, Button, IconButton, Toolbar, Typography } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';

import { ThemeToggle } from '../primitives/ThemeToggle';
import { ServerHeader } from '../layout/ServerHeader';

export interface HeaderProps {
  title: string;
  headerActions?: React.ReactNode;
  showMobileNavButton?: boolean;
  onOpenMobileNav?: () => void;
  onLogout?: () => void;
}

export function Header(props: HeaderProps) {
  const { title, headerActions, showMobileNavButton, onOpenMobileNav, onLogout } = props;

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
            <IconButton aria-label="Open navigation" onClick={onOpenMobileNav}>
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
          <ThemeToggle />
          {onLogout ? (
            <Button color="inherit" onClick={onLogout} sx={{ textTransform: 'none' }}>
              Logout
            </Button>
          ) : null}
        </Box>
      </Toolbar>
    </AppBar>
  );
}

