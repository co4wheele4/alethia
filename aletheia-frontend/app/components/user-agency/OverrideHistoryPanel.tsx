/**
 * OverrideHistoryPanel Component
 * Full history visible for overrides
 */

'use client';

import { Box, Typography, List, ListItem, ListItemText } from '@mui/material';

export interface OverrideRecord {
  id: string;
  timestamp: string;
  reason: string;
  user: string;
  previousValue?: string;
  newValue?: string;
}

export interface OverrideHistoryPanelProps {
  // TODO: Define props
  overrides?: OverrideRecord[];
}

export function OverrideHistoryPanel(props: OverrideHistoryPanelProps) {
  const { overrides = [] } = props;

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Override History
      </Typography>
      <List>
        {overrides.length === 0 && (
          <ListItem>
            <ListItemText primary="No overrides recorded" />
          </ListItem>
        )}
        {overrides.map((override) => (
          <ListItem key={override.id}>
            <ListItemText
              primary={`${override.timestamp} by ${override.user}`}
              secondary={override.reason}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
