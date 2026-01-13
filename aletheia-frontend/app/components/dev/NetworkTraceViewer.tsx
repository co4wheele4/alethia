/**
 * NetworkTraceViewer Component
 * Network request viewer
 */

'use client';

import { Box, Typography, List, ListItem, ListItemText } from '@mui/material';

export interface NetworkRequest {
  id: string;
  url: string;
  method: string;
  status?: number;
  timestamp: string;
  duration?: number;
}

export interface NetworkTraceViewerProps {
  // TODO: Define props
  requests?: NetworkRequest[];
}

export function NetworkTraceViewer(props: NetworkTraceViewerProps) {
  const { requests = [] } = props;

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Network Trace (Dev Mode)
      </Typography>
      <List>
        {requests.length === 0 && (
          <ListItem>
            <ListItemText primary="No network requests recorded" />
          </ListItem>
        )}
        {requests.map((request) => (
          <ListItem key={request.id}>
            <ListItemText
              primary={`${request.method} ${request.url}`}
              secondary={`Status: ${request.status || 'pending'} | ${request.timestamp} ${
                request.duration ? `| ${request.duration}ms` : ''
              }`}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
