/**
 * ConflictResolver Component
 * Conflict resolution interface
 */

'use client';

import { useState } from 'react';
import { Box, Typography, Button, RadioGroup, FormControlLabel, Radio } from '@mui/material';

export interface Conflict {
  id: string;
  description: string;
  options: Array<{ value: string; label: string }>;
}

export interface ConflictResolverProps {
  // TODO: Define props
  conflict?: Conflict;
  onResolve?: (conflictId: string, selectedValue: string) => void;
}

export function ConflictResolver(props: ConflictResolverProps) {
  const { conflict, onResolve } = props;
  const [selectedValue, setSelectedValue] = useState<string>('');

  if (!conflict) {
    return <Typography>TODO: Implement conflict resolver</Typography>;
  }

  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>
        Conflict: {conflict.description}
      </Typography>
      <RadioGroup
        value={selectedValue}
        onChange={(e) => setSelectedValue(e.target.value)}
      >
        {conflict.options.map((option) => (
          <FormControlLabel
            key={option.value}
            value={option.value}
            control={<Radio />}
            label={option.label}
          />
        ))}
      </RadioGroup>
      <Button
        variant="contained"
        onClick={() => onResolve?.(conflict.id, selectedValue)}
        disabled={!selectedValue}
        sx={{ mt: 2 }}
      >
        Resolve Conflict
      </Button>
    </Box>
  );
}
