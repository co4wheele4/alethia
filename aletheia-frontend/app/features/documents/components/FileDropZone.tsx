'use client';

import { Box, Typography } from '@mui/material';

export interface FileDropZoneProps {
  disabled?: boolean;
  accept: string;
  onAddFiles: (files: FileList) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

export function FileDropZone(props: FileDropZoneProps) {
  const { disabled, accept, onAddFiles, inputRef } = props;

  return (
    <Box
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (disabled) return;
        if (e.dataTransfer?.files?.length) onAddFiles(e.dataTransfer.files);
      }}
      role="button"
      tabIndex={0}
      aria-label="file-dropzone"
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === 'Enter' || e.key === ' ') {
          inputRef.current?.click();
        }
      }}
      onClick={() => {
        if (!disabled) inputRef.current?.click();
      }}
      sx={{
        border: '1px dashed',
        borderColor: 'divider',
        borderRadius: 1,
        p: 3,
        bgcolor: 'background.default',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <Typography variant="subtitle1">Drag & drop files here</Typography>
      <Typography variant="body2" color="text.secondary">
        Or click to choose files. Supported: PDF, DOCX, TXT/MD, CSV, HTML. Multi-file supported.
      </Typography>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        disabled={disabled}
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files) onAddFiles(e.target.files);
          e.currentTarget.value = '';
        }}
      />
    </Box>
  );
}

