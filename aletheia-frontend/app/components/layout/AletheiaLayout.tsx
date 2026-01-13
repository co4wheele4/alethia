/**
 * AletheiaLayout Component
 * Main application layout - typography-first, no decorative noise
 */

'use client';

import { Box, Container } from '@mui/material';

export interface AletheiaLayoutProps {
  // TODO: Define props
  children?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export function AletheiaLayout(props: AletheiaLayoutProps) {
  const { children, header, footer } = props;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {header && <Box component="header">{header}</Box>}
      <Box component="main" sx={{ flexGrow: 1 }}>
        <Container maxWidth="lg" sx={{ py: 3 }}>
          {children}
        </Container>
      </Box>
      {footer && <Box component="footer">{footer}</Box>}
    </Box>
  );
}
