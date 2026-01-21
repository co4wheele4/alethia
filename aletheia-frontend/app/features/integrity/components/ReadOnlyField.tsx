/**
 * ReadOnlyField Component
 * Read-only field component with no hidden edit affordances
 */

'use client';

import { TextField } from '@mui/material';

export interface ReadOnlyFieldProps {
  // TODO: Define props
  label?: string;
  value?: string;
  multiline?: boolean;
}

export function ReadOnlyField(props: ReadOnlyFieldProps) {
  const { label, value, multiline } = props;

  return (
    <TextField
      label={label}
      value={value || ''}
      multiline={multiline}
      InputProps={{
        readOnly: true,
      }}
      fullWidth
      variant="outlined"
      sx={{
        '& .MuiInputBase-input': {
          cursor: 'default',
        },
      }}
    />
  );
}
