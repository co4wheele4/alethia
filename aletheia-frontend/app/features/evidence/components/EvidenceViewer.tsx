'use client';

/**
 * ADR-028: Verbatim evidence display + navigational tooling only (no summarization).
 * ADR-032: HTML_PAGE uses raw body bytes; optional sandbox preview does not mutate stored bytes.
 */
import { useMemo, useState } from 'react';
import { Box, Button, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';

export type EvidenceViewMode = 'FULL' | 'PAGED';

export type HtmlStoredViewMode = 'STORED_TEXT' | 'SANDBOX_PREVIEW' | 'RAW_BYTES_HEX';

export type EvidenceViewerProps = {
  content: string;
  /** HTML_PAGE raw bytes (ADR-032). When set, HTML-specific views are shown. */
  rawBodyBase64?: string | null;
  sourceUrl?: string | null;
  contentSha256?: string | null;
  sourceTypeLabel: string;
  createdAtLabel: string;
  pageSize?: number;
};

function bytesFromBase64(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) {
    out[i] = bin.charCodeAt(i) & 0xff;
  }
  return out;
}

function latin1StringFromBytes(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i += 1) {
    s += String.fromCharCode(bytes[i]);
  }
  return s;
}

function hexDump(bytes: Uint8Array): string {
  const lines: string[] = [];
  for (let i = 0; i < bytes.length; i += 16) {
    const chunk = bytes.slice(i, i + 16);
    const hex = [...chunk].map((b) => b.toString(16).padStart(2, '0')).join(' ');
    lines.push(`${i.toString(16).padStart(8, '0')}  ${hex}`);
  }
  return lines.join('\n');
}

export function EvidenceViewer(props: EvidenceViewerProps) {
  const {
    content,
    rawBodyBase64,
    sourceUrl,
    contentSha256,
    sourceTypeLabel,
    createdAtLabel,
    pageSize = 8000,
  } = props;

  const [mode, setMode] = useState<EvidenceViewMode>('FULL');
  const [htmlMode, setHtmlMode] = useState<HtmlStoredViewMode>('STORED_TEXT');

  const storedBytes = useMemo(() => {
    if (!rawBodyBase64) return null;
    try {
      return bytesFromBase64(rawBodyBase64);
    } catch {
      return null;
    }
  }, [rawBodyBase64]);

  const latin1FromStored = useMemo(() => {
    if (!storedBytes) return '';
    return latin1StringFromBytes(storedBytes);
  }, [storedBytes]);

  const hexFromStored = useMemo(() => {
    if (!storedBytes) return '';
    return hexDump(storedBytes);
  }, [storedBytes]);

  const pages = useMemo(() => {
    if (storedBytes) return [latin1FromStored];
    if (mode !== 'PAGED') return [content];
    const out: string[] = [];
    for (let i = 0; i < content.length; i += pageSize) {
      out.push(content.slice(i, i + pageSize));
    }
    return out.length ? out : [''];
  }, [content, mode, pageSize, storedBytes, latin1FromStored]);

  const [pageIndex, setPageIndex] = useState(0);
  const safeIndex = Math.min(pageIndex, Math.max(0, pages.length - 1));
  const shown = pages[safeIndex] ?? '';

  const preContent = storedBytes
    ? htmlMode === 'RAW_BYTES_HEX'
      ? hexFromStored
      : latin1FromStored
    : shown;

  return (
    <Stack spacing={2} data-testid="evidence-viewer">
      <Stack direction="row" spacing={2} flexWrap="wrap" alignItems="center">
        <Typography variant="body2">Source type: {sourceTypeLabel}</Typography>
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
            const payload =
              storedBytes && htmlMode === 'RAW_BYTES_HEX' ? hexFromStored : storedBytes ? latin1FromStored : content;
            void navigator.clipboard.writeText(payload);
          }}
        >
          Copy raw content
        </Button>
        {storedBytes ? (
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              void navigator.clipboard.writeText(rawBodyBase64 ?? '');
            }}
          >
            Copy raw bytes (base64)
          </Button>
        ) : null}
        {sourceUrl ? (
          <Button size="small" href={sourceUrl} target="_blank" rel="noreferrer">
            Open source reference
          </Button>
        ) : null}
      </Stack>

      {storedBytes ? (
        <>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={htmlMode}
            onChange={(_, v) => {
              if (v) setHtmlMode(v);
            }}
          >
            <ToggleButton value="STORED_TEXT">View: stored text</ToggleButton>
            <ToggleButton value="SANDBOX_PREVIEW">View: sandbox preview</ToggleButton>
            <ToggleButton value="RAW_BYTES_HEX">View: raw bytes (hex)</ToggleButton>
          </ToggleButtonGroup>
          {htmlMode === 'SANDBOX_PREVIEW' ? (
            <Box
              component="iframe"
              title="HTML sandbox preview"
              sandbox=""
              srcDoc={latin1FromStored}
              sx={{
                width: '100%',
                minHeight: 360,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
              }}
              data-testid="evidence-html-sandbox-preview"
            />
          ) : (
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
              {preContent}
            </Box>
          )}
        </>
      ) : (
        <>
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
        </>
      )}
    </Stack>
  );
}
