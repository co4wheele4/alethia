/**
 * MissingDataAlert Component
 * Dedicated UI for gaps - never silently ignored
 */

'use client';

import { Alert, AlertTitle } from '@mui/material';

export interface MissingDataAlertProps {
  // TODO: Define props
  message?: string;
  field?: string;
}

export function MissingDataAlert(props: MissingDataAlertProps) {
  const { message, field } = props;

  return (
    <Alert severity="warning">
      <AlertTitle>Missing Data</AlertTitle>
      {message || (field ? `Data missing for field: ${field}` : 'Required data is missing')}
    </Alert>
  );
}
