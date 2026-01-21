/**
 * HumanOverrideButton Component
 * Override AI results - always available
 */

'use client';

import { Button } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';

export interface HumanOverrideButtonProps {
  // TODO: Define props
  onOverride?: () => void;
  label?: string;
}

export function HumanOverrideButton(props: HumanOverrideButtonProps) {
  const { onOverride, label = 'Override AI Result' } = props;

  return (
    <Button
      variant="outlined"
      startIcon={<EditIcon />}
      onClick={onOverride}
      color="primary"
    >
      {label}
    </Button>
  );
}
