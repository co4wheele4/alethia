'use client';

import { Alert, Box, TextField } from '@mui/material';

export interface ManualTextEditorProps {
  title: string;
  text: string;
  disabled?: boolean;
  onTitleChange: (value: string) => void;
  onTextChange: (value: string) => void;
}

export function ManualTextEditor(props: ManualTextEditorProps) {
  const { title, text, disabled, onTitleChange, onTextChange } = props;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        label="Title"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        disabled={disabled}
        autoFocus
        slotProps={{ htmlInput: { 'data-testid': 'ingest-manual-title' } }}
      />
      <TextField
        label="Text"
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        disabled={disabled}
        minRows={8}
        multiline
        placeholder="Paste raw text to ingest. This becomes the auditable snapshot stored in chunks."
        slotProps={{ htmlInput: { 'data-testid': 'ingest-manual-text' } }}
      />
      <Alert severity="info">
        Manual text is ingested as an immutable snapshot. After ingestion, you will inspect evidence chunks; you will
        not edit the source.
      </Alert>
    </Box>
  );
}

