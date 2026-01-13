/**
 * UnknownsList Component
 * List of unknown/missing data - never silently ignored
 */

'use client';

import { Box, List, ListItem, ListItemText, Typography } from '@mui/material';

export interface UnknownItem {
  id: string;
  field: string;
  reason?: string;
}

export interface UnknownsListProps {
  // TODO: Define props
  unknowns?: UnknownItem[];
}

export function UnknownsList(props: UnknownsListProps) {
  const { unknowns = [] } = props;

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Unknown or Missing Data
      </Typography>
      <List>
        {unknowns.length === 0 && (
          <ListItem>
            <ListItemText primary="No unknown data" />
          </ListItem>
        )}
        {unknowns.map((item) => (
          <ListItem key={item.id}>
            <ListItemText
              primary={item.field}
              secondary={item.reason || 'Data is unknown or missing'}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
