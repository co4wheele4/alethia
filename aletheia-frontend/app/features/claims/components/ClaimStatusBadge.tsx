'use client';

import { Chip } from '@mui/material';

import type { ClaimStatus } from '../hooks/useClaims';

function labelFor(status: ClaimStatus) {
  switch (status) {
    case 'DRAFT':
      return 'Draft';
    case 'REVIEWED':
      return 'Reviewed';
    case 'ACCEPTED':
      return 'Accepted';
    case 'REJECTED':
      return 'Rejected';
  }
}

function colorFor(status: ClaimStatus): 'default' | 'success' | 'warning' | 'error' | 'info' {
  switch (status) {
    case 'DRAFT':
      return 'default';
    case 'REVIEWED':
      return 'info';
    case 'ACCEPTED':
      return 'success';
    case 'REJECTED':
      return 'error';
  }
}

export function ClaimStatusBadge(props: { status: ClaimStatus; testId?: string }) {
  const { status, testId } = props;
  return (
    <Chip
      size="small"
      label={labelFor(status)}
      color={colorFor(status)}
      variant="outlined"
      data-testid={testId}
    />
  );
}

