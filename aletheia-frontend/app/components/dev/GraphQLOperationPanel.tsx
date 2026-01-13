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
                <pre style={{ fontSize: '0.875rem' }}>{op.operation}</pre>
              )}
              {selectedTab === 1 && (
                <pre style={{ fontSize: '0.875rem' }}>
                  {JSON.stringify(op.variables, null, 2)}
                </pre>
              )}
              {selectedTab === 2 && (
                <pre style={{ fontSize: '0.875rem' }}>
                  {JSON.stringify(op.response, null, 2)}
                </pre>
              )}
              {selectedTab === 3 && op.error && (
                <pre style={{ fontSize: '0.875rem', color: 'error.main' }}>{op.error}</pre>
              )}
            </Box>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}
