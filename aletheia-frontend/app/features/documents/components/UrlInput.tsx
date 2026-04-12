'use client';

import { Alert, Box, TextField } from '@mui/material';

export interface UrlInputProps {
  url: string;
  titleOverride: string;
  disabled?: boolean;
  error?: string | null;
  onUrlChange: (value: string) => void;
  onTitleOverrideChange: (value: string) => void;
  onClearError?: () => void;
}

export function UrlInput(props: UrlInputProps) {
  const { url, titleOverride, disabled, error, onUrlChange, onTitleOverrideChange, onClearError } = props;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {error ? (
        <Alert severity="error" onClose={onClearError}>
          {error}
        </Alert>
      ) : (
        <Alert severity="info">
          URL import uses this app&apos;s server to fetch public http(s) pages (avoids browser CORS). Some sites may
          still block automated requests or return consent pages.
        </Alert>
      )}

      <TextField
        label="URL"
        value={url}
        onChange={(e) => onUrlChange(e.target.value)}
        disabled={disabled}
        placeholder="https://example.com/article"
      />
      <TextField
        label="Title override (optional)"
        value={titleOverride}
        onChange={(e) => onTitleOverrideChange(e.target.value)}
        disabled={disabled}
      />
    </Box>
  );
}

