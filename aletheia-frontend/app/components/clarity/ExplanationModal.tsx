/**
 * ExplanationModal Component
 * Step-by-step reasoning shown in plain language
 */

'use client';

import { Modal, Box, Typography, Button } from '@mui/material';

export interface ExplanationModalProps {
  // TODO: Define props
  open?: boolean;
  onClose?: () => void;
  title?: string;
  steps?: Array<{ step: number; description: string }>;
}

export function ExplanationModal(props: ExplanationModalProps) {
  const { open = false, onClose, title = 'Explanation', steps = [] } = props;

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 600,
          bgcolor: 'background.paper',
          p: 3,
          borderRadius: 2,
        }}
      >
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        {/* TODO: Implement step-by-step reasoning */}
        {steps.length === 0 && <Typography>TODO: Implement explanation steps</Typography>}
        {steps.map((item) => (
          <Box key={item.step} sx={{ mb: 2 }}>
            <Typography variant="subtitle2">Step {item.step}</Typography>
            <Typography variant="body2">{item.description}</Typography>
          </Box>
        ))}
        <Button onClick={onClose} sx={{ mt: 2 }}>
          Close
        </Button>
      </Box>
    </Modal>
  );
}
