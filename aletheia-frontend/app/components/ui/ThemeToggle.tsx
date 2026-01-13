'use client';

import { IconButton, Tooltip, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { Brightness4, Brightness7, SettingsBrightness } from '@mui/icons-material';
import { useTheme } from '../../hooks/useTheme';
import { useState } from 'react';

export function ThemeToggle() {
  const { themeMode, toggleTheme, setThemeMode } = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleThemeSelect = (mode: 'light' | 'dark' | 'system') => {
    setThemeMode(mode);
    handleClose();
  };

  const getIcon = () => {
    switch (themeMode) {
      case 'light':
        return <Brightness7 />;
      case 'dark':
        return <Brightness4 />;
      case 'system':
        return <SettingsBrightness />;
      /* c8 ignore next 2 */
      default:
        return <SettingsBrightness />; // Unreachable in practice, but TypeScript requires it
    }
  };

  const getLabel = () => {
    switch (themeMode) {
      case 'light':
        return 'Light theme';
      case 'dark':
        return 'Dark theme';
      case 'system':
        return 'System theme';
      /* c8 ignore next 2 */
      default:
        return 'Theme'; // Unreachable in practice, but TypeScript requires it
    }
  };

  return (
    <>
      <Tooltip title={getLabel()}>
        <IconButton
          onClick={handleClick}
          color="inherit"
          aria-label="toggle theme"
          aria-controls={open ? 'theme-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
        >
          {getIcon()}
        </IconButton>
      </Tooltip>
      <Menu
        id="theme-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'theme-button',
        }}
      >
        <MenuItem onClick={() => handleThemeSelect('light')} selected={themeMode === 'light'}>
          <ListItemIcon>
            <Brightness7 fontSize="small" />
          </ListItemIcon>
          <ListItemText>Light</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleThemeSelect('dark')} selected={themeMode === 'dark'}>
          <ListItemIcon>
            <Brightness4 fontSize="small" />
          </ListItemIcon>
          <ListItemText>Dark</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleThemeSelect('system')} selected={themeMode === 'system'}>
          <ListItemIcon>
            <SettingsBrightness fontSize="small" />
          </ListItemIcon>
          <ListItemText>System</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
