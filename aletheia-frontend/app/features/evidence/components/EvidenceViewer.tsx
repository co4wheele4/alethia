'use client';

/**
 * ADR-028: Verbatim evidence display + navigational tooling only (no summarization).
 */
import { useMemo, useState } from 'react';
import { Box, Button, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';

export type EvidenceViewMode = 'FULL' | 'PAGED';

export type EvidenceViewerProps = {
  content: string;
  sourceUrl?: string | null;
  contentSha256?: string | null;
  sourceTypeLabel: string;
  createdAtLabel: string;
  pageSize?: number;
};

export function EvidenceViewer(props: EvidenceViewerProps) {
  const { content, sourceUrl, contentSha256, sourceTypeLabel, createdAtLabel, pageSize = 8000 } = props;
  const [mode, setMode] = useState<EvidenceViewMode>('FULL');

  const pages = useMemo(() => {
    if (mode !== 'PAGED') return [content];
    const out: string[] = [];
    for (let i = 0; i < content.length; i += pageSize) {
      out.push(content.slice(i, i + pageSize));
    }
    return out.length ? out : [''];
  }, [content, mode, pageSize]);

  const [pageIndex, setPageIndex] = useState(0);
  const safeIndex = Math.min(pageIndex, Math.max(0, pages.length - 1));
  const shown = pages[safeIndex] ?? '';

  return (
    <Stack spacing={2} data-testid="evidence-viewer">
      <Stack direction="row" spacing={2} flexWrap="wrap" alignItems="center">
        <Typography variant="body2">
          Source type: {sourceTypeLabel}
        </Typography>
        <Typography variant="body2">Stored at: {createdAtLabel}</Typography>
        {contentSha256 ? (
          <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
            contentSha256: {contentSha256}
          </Typography>
        ) : null}
        <Button
          size="small"
          variant="outlined"
          onClick={() => {
            void navigator.clipboard.writeText(content);
          }}
        >
          Copy raw content
        </Button>
        {sourceUrl ? (
          <Button size="small" href={sourceUrl} target="_blank" rel="noreferrer">
            Open source reference
          </Button>
        ) : null}
      </Stack>
      <ToggleButtonGroup
        size="small"
        exclusive
        value={mode}
        onChange={(_, v) => {
          if (v) {
            setMode(v);
            setPageIndex(0);
          }
        }}
      >
        <ToggleButton value="FULL">View: full</ToggleButton>
        <ToggleButton value="PAGED">View: paged</ToggleButton>
      </ToggleButtonGroup>
      {mode === 'PAGED' && pages.length > 1 ? (
        <Stack direction="row" spacing={1} alignItems="center">
          <Button
            size="small"
            disabled={safeIndex <= 0}
            onClick={() => setPageIndex((i) => Math.max(0, i - 1))}
          >
            Previous page
          </Button>
          <Typography variant="body2">
            Page {safeIndex + 1} / {pages.length}
          </Typography>
          <Button
            size="small"
            disabled={safeIndex >= pages.length - 1}
            onClick={() => setPageIndex((i) => Math.min(pages.length - 1, i + 1))}
          >
            Next page
          </Button>
        </Stack>
      ) : null}
      <Box
        component="pre"
        sx={{
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          fontFamily: 'monospace',
          fontSize: 14,
          p: 2,
          border: '1px solid',
          borderColor: 'divider',
          maxHeight: 480,
          overflow: 'auto',
        }}
        data-testid="evidence-viewer-content"
      >
        {shown}
      </Box>
    </Stack>
  );
}
