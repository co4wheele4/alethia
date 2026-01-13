/**
 * AIRationalePanel Component
 * AI reasoning explanation
 */

'use client';

import { Box, Typography, List, ListItem, ListItemText } from '@mui/material';

export interface AIRationaleStep {
  step: number;
  reasoning: string;
  evidence?: string[];
}

export interface AIRationalePanelProps {
  // TODO: Define props
  rationale?: AIRationaleStep[];
  title?: string;
}

export function AIRationalePanel(props: AIRationalePanelProps) {
  const { rationale = [], title = 'AI Reasoning' } = props;

  return (
    <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      {rationale.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          No rationale provided
        </Typography>
      )}
      <List>
        {rationale.map((step) => (
          <ListItem key={step.step}>
            <ListItemText
              primary={`Step ${step.step}`}
              secondary={step.reasoning}
            />
            {step.evidence && step.evidence.length > 0 && (
              <Box sx={{ ml: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Evidence: {step.evidence.join(', ')}
                </Typography>
              </Box>
            )}
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
