/**
 * ActionSummaryFooter Component
 * Clear outcome statements - no dark patterns
 */

'use client';

import { Box, Typography, List, ListItem, ListItemText } from '@mui/material';

export interface ActionSummaryFooterProps {
  // TODO: Define props
  summary?: string;
  consequences?: string[];
}

export function ActionSummaryFooter(props: ActionSummaryFooterProps) {
  const { summary, consequences = [] } = props;

  return (
    <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
      {summary && (
        <Typography variant="body2" gutterBottom>
          {summary}
        </Typography>
      )}
      {consequences.length > 0 && (
        <Box>
          <Typography variant="subtitle2" gutterBottom sx={{ mt: 1 }}>
            Consequences:
          </Typography>
          <List dense sx={{ p: 0 }}>
            {consequences.map((consequence, index) => (
              <ListItem key={index} sx={{ p: 0, display: 'list-item', ml: 3, listStyleType: 'disc' }}>
                <ListItemText 
                  primary={consequence} 
                  primaryTypographyProps={{ variant: 'body2' }} 
                />
              </ListItem>
            ))}
          </List>
        </Box>
      )}
    </Box>
  );
}
