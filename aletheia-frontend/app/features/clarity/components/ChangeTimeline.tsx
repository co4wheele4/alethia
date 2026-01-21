/**
 * ChangeTimeline Component
 * Vertical timeline for change history
 */

'use client';

import { Box, Typography } from '@mui/material';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

export interface ChangeEvent {
  id: string;
  timestamp: string;
  description: string;
  author?: string;
}

export interface ChangeTimelineProps {
  // TODO: Define props
  events?: ChangeEvent[];
}

export function ChangeTimeline(props: ChangeTimelineProps) {
  const { events = [] } = props;

  return (
    <Box>
      {/* TODO: Implement change timeline - consider installing @mui/lab for Timeline component */}
      {events.length === 0 && (
        <Box sx={{ py: 2 }}>
          <Typography variant="body2" color="text.secondary">
            No change events recorded
          </Typography>
        </Box>
      )}
      {events.map((event, index) => (
        <Box key={event.id} sx={{ display: 'flex', mb: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mr: 2 }}>
            <FiberManualRecordIcon sx={{ fontSize: 12, color: 'primary.main' }} />
            {index < events.length - 1 && (
              <Box
                sx={{
                  width: 2,
                  height: '100%',
                  bgcolor: 'divider',
                  mt: 0.5,
                  mb: -2,
                }}
              />
            )}
          </Box>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="body2">{event.description}</Typography>
            <Typography variant="caption" color="text.secondary">
              {event.timestamp} {event.author && `by ${event.author}`}
            </Typography>
          </Box>
        </Box>
      ))}
    </Box>
  );
}
