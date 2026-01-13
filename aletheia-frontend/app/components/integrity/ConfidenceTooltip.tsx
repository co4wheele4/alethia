/**
 * ConfidenceTooltip Component
 * Tooltip with confidence details
 */

'use client';

import { Tooltip, Typography } from '@mui/material';

export interface ConfidenceTooltipProps {
  // TODO: Define props
  confidence?: number;
  children: React.ReactNode;
  details?: string;
}

export function ConfidenceTooltip(props: ConfidenceTooltipProps) {
  const { confidence, children, details } = props;

  const tooltipText = details || (confidence !== undefined ? `Confidence: ${confidence}%` : 'Confidence information');

  return (
    <Tooltip title={tooltipText}>
      {children as React.ReactElement}
    </Tooltip>
  );
}
