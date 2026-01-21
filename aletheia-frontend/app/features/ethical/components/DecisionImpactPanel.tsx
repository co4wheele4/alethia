/**
 * DecisionImpactPanel Component
 * Impact visualization - no surprise side effects
 */

'use client';

import { Box, Typography, List, ListItem, ListItemText } from '@mui/material';

export interface Impact {
  area: string;
  description: string;
  severity?: 'low' | 'medium' | 'high';
}

export interface DecisionImpactPanelProps {
  // TODO: Define props
  impacts?: Impact[];
  title?: string;
}

export function DecisionImpactPanel(props: DecisionImpactPanelProps) {
  const { impacts = [], title = 'Decision Impact' } = props;

  return (
    <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      {impacts.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          No impacts identified
        </Typography>
      )}
      <List>
        {impacts.map((impact, index) => (
          <ListItem key={index}>
            <ListItemText
              primary={impact.area}
              secondary={impact.description}
            />
            {impact.severity && (
              <Typography variant="caption" color="text.secondary">
                {impact.severity}
              </Typography>
            )}
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
