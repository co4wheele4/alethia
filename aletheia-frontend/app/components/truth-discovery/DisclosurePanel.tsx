/**
 * DisclosurePanel Component
 * Clear "More context" affordance for progressive disclosure
 */

'use client';

import { Accordion, AccordionSummary, AccordionDetails, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export interface DisclosurePanelProps {
  // TODO: Define props
  title?: string;
  summary?: string;
  children?: React.ReactNode;
  defaultExpanded?: boolean;
}

export function DisclosurePanel(props: DisclosurePanelProps) {
  const { title, summary, children, defaultExpanded = false } = props;

  return (
    <Accordion defaultExpanded={defaultExpanded}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="subtitle1">{title || 'More context'}</Typography>
        {summary && (
          <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
            {summary}
          </Typography>
        )}
      </AccordionSummary>
      <AccordionDetails>
        {/* TODO: Implement disclosure panel content */}
        {children || <p>DisclosurePanel - TODO: Implement</p>}
      </AccordionDetails>
    </Accordion>
  );
}
