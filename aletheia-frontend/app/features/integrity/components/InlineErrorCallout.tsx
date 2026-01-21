/**
 * InlineErrorCallout Component
 * Inline error display
 */

'use client';

import { Alert } from '@mui/material';

export interface InlineErrorCalloutProps {
  // TODO: Define props
  message?: string;
  severity?: 'error' | 'warning' | 'info';
}

export function InlineErrorCallout(props: InlineErrorCalloutProps) {
  const { message, severity = 'error' } = props;

  return (
    <Alert severity={severity} sx={{ my: 1 }}>
      {message || 'An error occurred'}
    </Alert>
  );
}
