/**
 * ReasoningStepsList Component
 * Detailed reasoning breakdown
 */

'use client';

import { List, ListItem, ListItemText, Typography } from '@mui/material';

export interface ReasoningStep {
  step: number;
  description: string;
  evidence?: string[];
}

export interface ReasoningStepsListProps {
  // TODO: Define props
  steps?: ReasoningStep[];
}

export function ReasoningStepsList(props: ReasoningStepsListProps) {
  const { steps = [] } = props;

  return (
    <List>
      {/* TODO: Implement reasoning steps list */}
      {steps.length === 0 && (
        <ListItem>
          <ListItemText primary="ReasoningStepsList - TODO: Implement" />
        </ListItem>
      )}
      {steps.map((step) => (
        <ListItem key={step.step}>
          <ListItemText
            primary={`Step ${step.step}`}
            secondary={step.description}
          />
        </ListItem>
      ))}
    </List>
  );
}
