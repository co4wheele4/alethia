/**
 * StateInspector Component
 * Inspect UI state vs data input - useful for debugging truth mismatches
 */

'use client';

import { Box, Typography, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export interface StateInspectorProps {
  // TODO: Define props
  uiState?: Record<string, unknown>;
  dataState?: Record<string, unknown>;
}

export function StateInspector(props: StateInspectorProps) {
  const { uiState, dataState } = props;

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        State Inspector (Dev Mode)
      </Typography>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>UI State</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography 
            component="pre" 
            sx={{ fontSize: '0.875rem', fontFamily: 'monospace', m: 0 }}
          >
            {JSON.stringify(uiState, null, 2)}
          </Typography>
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Data State</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography 
            component="pre" 
            sx={{ fontSize: '0.875rem', fontFamily: 'monospace', m: 0 }}
          >
            {JSON.stringify(dataState, null, 2)}
          </Typography>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}
