/**
 * UncertaintyBadge
 *
 * Uncertainty must be explicit and never hidden.
 */

'use client';

import { Chip } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

export type UncertaintyLevel = 'unknown' | 'uncertain' | 'partial' | 'known';

export interface UncertaintyBadgeProps {
  level: UncertaintyLevel;
  /**
   * Optional override for the label.
   */
  label?: string;
}

export function UncertaintyBadge(props: UncertaintyBadgeProps) {
  const { level, label } = props;

  const resolvedLabel =
    label ??
    (level === 'known'
      ? 'Known'
      : level === 'partial'
        ? 'Partially supported'
        : level === 'uncertain'
          ? 'Uncertain'
          : 'Unknown');

  const color: 'default' | 'success' | 'warning' = level === 'known' ? 'success' : level === 'partial' ? 'warning' : 'default';

  return (
    <Chip
      icon={<HelpOutlineIcon />}
      size="small"
      label={resolvedLabel}
      color={color}
      variant={level === 'known' ? 'filled' : 'outlined'}
      sx={{ opacity: level === 'unknown' ? 0.75 : 1 }}
    />
  );
}

