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
  variant?: 'desktop' | 'drawer';
  onNavigate?: () => void;
}

export function PrimaryNav(props: PrimaryNavProps) {
  const { items, ariaLabel = 'primary navigation', footer, variant = 'desktop', onNavigate } = props;
  const pathname = usePathname();

  return (
    <Box
      component="nav"
      aria-label={ariaLabel}
      sx={{
        width: 300,
        flexShrink: 0,
        borderRight: '1px solid',
        borderColor: 'divider',
        display: variant === 'desktop' ? { xs: 'none', md: 'flex' } : 'flex',
        flexDirection: 'column',
        height: '100%',
        // Translucent surface: ~20% lighter than the main background, so the global bg
        // (including the image) remains visible while the nav stays readable.
        bgcolor: (theme) => alpha(lighten(theme.palette.background.default, 0.2), 0.72),
      }}
    >
      <Box sx={{ px: 2, py: 2 }}>
        <Typography variant="subtitle2" sx={{ letterSpacing: 0.4 }}>
          Aletheia
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Epistemic instrument (provenance-first)
        </Typography>
      </Box>

      <Divider />

      <List dense sx={{ py: 1 }}>
        {items.map((item) => {
          const selected = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <ListItemButton
              key={item.href}
              component={Link}
              href={item.href}
              selected={selected}
              sx={{ borderRadius: 1, mx: 1 }}
              onClick={() => onNavigate?.()}
            >
              <ListItemText
                primary={item.label}
                secondary={item.description}
                secondaryTypographyProps={{ variant: 'caption' }}
              />
            </ListItemButton>
          );
        })}
      </List>

      {footer ? (
        <>
          <Divider />
          <Box sx={{ px: 2, py: 2 }}>{footer}</Box>
        </>
      ) : null}
    </Box>
  );
}

