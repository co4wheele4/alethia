/**
 * OverrideToggle Component
 * Explicit override UI
 */

'use client';

import { Switch, FormControlLabel, Box } from '@mui/material';

export interface OverrideToggleProps {
  // TODO: Define props
  label?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
}

export function OverrideToggle(props: OverrideToggleProps) {
  const { label = 'Override', checked = false, onChange } = props;

  return (
    <Box>
      <FormControlLabel
        control={
          <Switch
            checked={checked}
            onChange={(e) => onChange?.(e.target.checked)}
          />
        }
        label={label}
      />
    </Box>
  );
}
