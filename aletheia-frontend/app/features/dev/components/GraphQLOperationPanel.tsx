/**
 * GraphQLOperationPanel Component
 * Dev-only panels showing queries, variables, and responses
 */

'use client';

import { Box, Typography, Accordion, AccordionSummary, AccordionDetails, Tabs, Tab } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useState } from 'react';

export interface GraphQLOperation {
  operation: string;
  variables?: Record<string, unknown>;
  response?: unknown;
  error?: string;
}

export interface GraphQLOperationPanelProps {
  // TODO: Define props
  operations?: GraphQLOperation[];
}

export function GraphQLOperationPanel(props: GraphQLOperationPanelProps) {
  const { operations = [] } = props;
  const [selectedTab, setSelectedTab] = useState(0);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        GraphQL Operations (Dev Mode)
      </Typography>
      {operations.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          No operations recorded
        </Typography>
      )}
      {operations.map((op, index) => (
        <Accordion key={index}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>{op.operation}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Tabs value={selectedTab} onChange={(_, newValue) => setSelectedTab(newValue)}>
              <Tab label="Query" />
              <Tab label="Variables" />
              <Tab label="Response" />
              {op.error && <Tab label="Error" />}
            </Tabs>
            <Box sx={{ mt: 2 }}>
              {selectedTab === 0 && (
                <Typography 
                  component="pre" 
                  sx={{ fontSize: '0.875rem', fontFamily: 'monospace', m: 0 }}
                >
                  {op.operation}
                </Typography>
              )}
              {selectedTab === 1 && (
                <Typography 
                  component="pre" 
                  sx={{ fontSize: '0.875rem', fontFamily: 'monospace', m: 0 }}
                >
                  {JSON.stringify(op.variables, null, 2)}
                </Typography>
              )}
              {selectedTab === 2 && (
                <Typography 
                  component="pre" 
                  sx={{ fontSize: '0.875rem', fontFamily: 'monospace', m: 0 }}
                >
                  {JSON.stringify(op.response, null, 2)}
                </Typography>
              )}
              {selectedTab === 3 && op.error && (
                <Typography 
                  component="pre" 
                  sx={{ fontSize: '0.875rem', fontFamily: 'monospace', color: 'error.main', m: 0 }}
                >
                  {op.error}
                </Typography>
              )}
            </Box>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}
