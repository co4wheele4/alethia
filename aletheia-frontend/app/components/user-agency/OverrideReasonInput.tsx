/**
 * OverrideReasonInput Component
 * Mandatory reason entry for overrides
 */

'use client';

import { TextField } from '@mui/material';

export interface OverrideReasonInputProps {
  // TODO: Define props
  value?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  error?: boolean;
  helperText?: string;
}

export function OverrideReasonInput(props: OverrideReasonInputProps) {
  const { value = '', onChange, required = true, error, helperText } = props;

  return (
    <TextField
      label="Reason for override"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      required={required}
      error={error}
      helperText={helperText || (required ? 'Reason is required' : '')}
      multiline
      rows={3}
      fullWidth
      variant="outlined"
    />
  );
}
