'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Box,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Typography,
} from '@mui/material';
import { alpha, lighten } from '@mui/material/styles';

export type PrimaryNavItem = {
  href: string;
  label: string;
  description?: string;
};

export interface PrimaryNavProps {
  items: PrimaryNavItem[];
  ariaLabel?: string;
  footer?: React.ReactNode;
  variant?: 'desktop' | 'drawer' | 'top';
  onNavigate?: () => void;
}

export function PrimaryNav(props: PrimaryNavProps) {
  const { items, ariaLabel = 'primary navigation', footer, variant = 'desktop', onNavigate } = props;
  const pathname = usePathname();
  const isTop = variant === 'top';
  const isDrawer = variant === 'drawer';

  return (
    <Box
      component="nav"
      aria-label={ariaLabel}
      sx={{
        width: isTop ? '100%' : 300,
        flexShrink: 0,
        borderRight: isTop ? undefined : '1px solid',
        borderBottom: isTop ? '1px solid' : undefined,
        borderColor: 'divider',
        display: isDrawer ? 'flex' : { xs: 'none', md: 'flex' },
        flexDirection: isTop ? 'row' : 'column',
        alignItems: isTop ? 'center' : undefined,
        height: isTop ? 'auto' : '100%',
        // Translucent surface: ~20% lighter than the main background, so the global bg
        // (including the image) remains visible while the nav stays readable.
        bgcolor: (theme) => alpha(lighten(theme.palette.background.default, 0.2), 0.72),
      }}
    >
      {!isTop ? (
        <>
          <Box sx={{ px: 2, py: 2 }}>
            <Typography variant="subtitle2" sx={{ letterSpacing: 0.4 }}>
              Aletheia
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Epistemic instrument (provenance-first)
            </Typography>
          </Box>

          <Divider />
        </>
      ) : null}

      <List
        dense
        sx={
          isTop
            ? {
                py: 0.75,
                px: 1,
                display: 'flex',
                flexDirection: 'row',
                gap: 0.5,
                overflowX: 'auto',
                overflowY: 'hidden',
                flexWrap: 'nowrap',
                width: '100%',
              }
            : { py: 1 }
        }
      >
        {items.map((item) => {
          const selected = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <ListItemButton
              key={item.href}
              component={Link}
              href={item.href}
              selected={selected}
              sx={
                isTop
                  ? {
                      borderRadius: 999,
                      minWidth: 'max-content',
                      px: 1.25,
                      py: 0.5,
                    }
                  : { borderRadius: 1, mx: 1 }
              }
              onClick={() => onNavigate?.()}
            >
              <ListItemText
                primary={item.label}
                secondary={isTop ? undefined : item.description}
                primaryTypographyProps={isTop ? { variant: 'body2' } : undefined}
                secondaryTypographyProps={isTop ? undefined : { variant: 'caption' }}
              />
            </ListItemButton>
          );
        })}
      </List>

      {footer && !isTop ? (
        <>
          <Divider />
          <Box sx={{ px: 2, py: 2 }}>{footer}</Box>
        </>
      ) : null}
    </Box>
  );
}

