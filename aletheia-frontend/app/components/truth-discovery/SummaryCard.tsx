/**
 * SummaryCard Component
 * Summaries shown by default in progressive disclosure pattern
 */

'use client';

import { Card, CardContent, Typography } from '@mui/material';

export interface SummaryCardProps {
  // TODO: Define props
  title?: string;
  summary?: string;
  onExpand?: () => void;
}

export function SummaryCard(props: SummaryCardProps) {
  return (
    <Card>
      <CardContent>
        {/* TODO: Implement summary card */}
        <Typography variant="h6">{props.title || 'SummaryCard - TODO: Implement'}</Typography>
        {props.summary && <Typography>{props.summary}</Typography>}
      </CardContent>
    </Card>
  );
}
