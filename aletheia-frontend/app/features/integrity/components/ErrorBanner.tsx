/**
 * ErrorBanner Component
 * Human-readable errors with clear attribution
 */

'use client';

import { Alert, AlertTitle, Typography } from '@mui/material';

export type ErrorSource = 'system' | 'user' | 'data';

export interface ErrorBannerProps {
  // TODO: Define props
  message?: string;
  source?: ErrorSource;
  title?: string;
  onClose?: () => void;
}

export function ErrorBanner(props: ErrorBannerProps) {
  const { message, source = 'system', title, onClose } = props;

  const getSourceLabel = (src: ErrorSource) => {
    switch (src) {
      case 'system':
        return 'System Error';
      case 'user':
        return 'User Error';
      case 'data':
        return 'Data Error';
      default:
        return 'Error';
    }
  };

  return (
    <Alert severity="error" onClose={onClose}>
      <AlertTitle>{title || getSourceLabel(source)}</AlertTitle>
      {message || 'An error occurred'}
      <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
        Source: {getSourceLabel(source)}
      </Typography>
    </Alert>
  );
}
