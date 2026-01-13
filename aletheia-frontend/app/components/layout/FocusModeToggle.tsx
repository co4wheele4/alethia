/**
 * FocusModeToggle Component
 * Toggle focus mode - collapses navigation and chrome
 */

'use client';

import { Switch, FormControlLabel } from '@mui/material';

export interface FocusModeToggleProps {
  // TODO: Define props
  enabled?: boolean;
  onChange?: (enabled: boolean) => void;
}

export function FocusModeToggle(props: FocusModeToggleProps) {
  const { enabled = false, onChange } = props;

  return (
    <FormControlLabel
      control={
        <Switch
          checked={enabled}
          onChange={(e) => onChange?.(e.target.checked)}
        />
      }
      label="Focus Mode"
    />
  );
}
