/**
 * WhyPanel Component
 * "Why am I seeing this?" link on computed values
 */

'use client';

import { Box, Button, Typography } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

export interface WhyPanelProps {
  // TODO: Define props
  onExplain?: () => void;
  explanation?: string;
}

export function WhyPanel(props: WhyPanelProps) {
  const { onExplain, explanation } = props;

  return (
    <Box>
      {/* TODO: Implement why panel */}
      <Button
        startIcon={<HelpOutlineIcon />}
        onClick={onExplain}
        size="small"
        variant="text"
      >
        Why am I seeing this?
      </Button>
      {explanation && <Typography variant="body2">{explanation}</Typography>}
    </Box>
  );
}
