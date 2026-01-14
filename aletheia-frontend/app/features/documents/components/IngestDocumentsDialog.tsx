/**
 * IngestDocumentsDialog
 *
 * First-class ingestion entrypoint with multiple sources:
 * - Manual text (default)
 * - File upload (drag-and-drop + multi-file)
 * - URL import (best-effort; may fail due to CORS)
 *
 * Users never interact with "files" after ingestion; the output is Documents + Chunks.
 */
'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';

import { parseFileToText } from '../ingestion/fileParsers';
import { importUrlToText } from '../ingestion/urlImport';
import { useIngestDocuments } from '../hooks/useIngestDocuments';
import { FileDropZone } from './FileDropZone';
import { IngestionStatusStepper } from './IngestionStatusStepper';
import { ManualTextEditor } from './ManualTextEditor';
import { UrlInput } from './UrlInput';

type TabKey = 'manual' | 'file' | 'url';

type FileRow = {
  file: File;
  status: 'ready' | 'parsing' | 'ingesting' | 'done' | 'error';
  message?: string;
  createdDocumentId?: string;
};

async function sha256HexOfFile(file: File): Promise<string | null> {
  try {
    if (!globalThis.crypto?.subtle) return null;
    const buf = await file.arrayBuffer();
    const digest = await globalThis.crypto.subtle.digest('SHA-256', buf);
    const bytes = new Uint8Array(digest);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    return null;
  }
}

function tabIndexOf(key: TabKey) {
  return key === 'manual' ? 0 : key === 'file' ? 1 : 2;
}
function tabKeyOf(index: number): TabKey {
  return index === 1 ? 'file' : index === 2 ? 'url' : 'manual';
}

const ACCEPT = [
  '.pdf',
  '.docx',
  '.txt',
  '.md',
  '.markdown',
  '.csv',
  '.html',
  '.htm',
].join(',');

export function IngestDocumentsDialog(props: {
  open: boolean;
  onClose: () => void;
  userId: string | null;
  onIngested: (documentId: string) => void;
}) {
  const { open, onClose, userId, onIngested } = props;
  const { canIngest, progress, ingestOne, reset } = useIngestDocuments(userId);

  const [tab, setTab] = useState<TabKey>('manual');
  const [confirmedIrreversible, setConfirmedIrreversible] = useState(false);

  // Manual
  const [manualTitle, setManualTitle] = useState('');
  const [manualText, setManualText] = useState('');

  // URL
  const [url, setUrl] = useState('');
  const [urlTitleOverride, setUrlTitleOverride] = useState('');
  const [urlBusy, setUrlBusy] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  // Files
  const [fileRows, setFileRows] = useState<FileRow[]>([]);
  const [filesBusy, setFilesBusy] = useState(false);
  const [filesError, setFilesError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const overallBusy = progress.state === 'running' || filesBusy || urlBusy;

  const onDialogClose = useCallback(() => {
    if (overallBusy) return;
    reset();
    setUrlError(null);
    setFilesError(null);
    setConfirmedIrreversible(false);
    onClose();
  }, [overallBusy, onClose, reset]);

  const addFiles = useCallback((files: FileList | File[]) => {
    const list = Array.from(files);
    if (list.length === 0) return;
    setFileRows((prev) => [
      ...prev,
      ...list.map((f) => ({ file: f, status: 'ready' as const })),
    ]);
  }, []);

  const canSubmitManual = useMemo(() => manualTitle.trim().length > 0 && manualText.trim().length > 0, [
    manualTitle,
    manualText,
  ]);

  return (
    <Dialog open={open} onClose={onDialogClose} fullWidth maxWidth="md">
      <DialogTitle>Ingest documents</DialogTitle>
      <DialogContent>
        {!canIngest ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            You must be logged in to ingest documents. (Unable to determine user id from token.)
          </Alert>
        ) : null}

        <Alert severity="warning" sx={{ mb: 2 }}>
          Ingestion is <strong>irreversible</strong>. Aletheia stores an immutable snapshot as chunks; the original
          source is never edited in-place.
        </Alert>

        <Tabs
          value={tabIndexOf(tab)}
          onChange={(_, v) => setTab(tabKeyOf(v))}
          aria-label="ingestion-path-tabs"
          sx={{ mb: 2 }}
        >
          <Tab label="Manual text (default)" />
          <Tab label="File upload" />
          <Tab label="URL import" />
        </Tabs>

        <Box sx={{ mb: 2 }}>
          {progress.state === 'running' ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <CircularProgress size={18} />
              <Typography variant="body2" color="text.secondary">
                Processing…
              </Typography>
            </Box>
          ) : null}
          <IngestionStatusStepper progress={progress} />
        </Box>

        {tab === 'manual' ? (
          <ManualTextEditor
            title={manualTitle}
            text={manualText}
            disabled={!canIngest || overallBusy}
            onTitleChange={setManualTitle}
            onTextChange={setManualText}
          />
        ) : null}

        {tab === 'file' ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {filesError ? (
              <Alert severity="error" onClose={() => setFilesError(null)}>
                {filesError}
              </Alert>
            ) : null}

            <FileDropZone
              disabled={!canIngest || overallBusy}
              accept={ACCEPT}
              inputRef={fileInputRef}
              onAddFiles={(files) => addFiles(files)}
            />

            {fileRows.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <Typography variant="subtitle2">Queued files</Typography>
                  <Button
                    size="small"
                    onClick={() => setFileRows([])}
                    disabled={overallBusy}
                    sx={{ textTransform: 'none' }}
                  >
                    Clear
                  </Button>
                </Box>
                {fileRows.map((row, idx) => (
                  <Box
                    key={`${row.file.name}-${row.file.lastModified}-${idx}`}
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto',
                      gap: 1,
                      p: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                    }}
                  >
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {row.file.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {row.status}
                        {row.message ? ` — ${row.message}` : ''}
                      </Typography>
                    </Box>
                    {row.createdDocumentId ? (
                      <Button
                        size="small"
                        variant="outlined"
                        sx={{ textTransform: 'none', whiteSpace: 'nowrap' }}
                        onClick={() => onIngested(row.createdDocumentId!)}
                      >
                        Open
                      </Button>
                    ) : null}
                  </Box>
                ))}
              </Box>
            ) : null}
          </Box>
        ) : null}

        {tab === 'url' ? (
          <UrlInput
            url={url}
            titleOverride={urlTitleOverride}
            disabled={!canIngest || overallBusy}
            error={urlError}
            onClearError={() => setUrlError(null)}
            onUrlChange={setUrl}
            onTitleOverrideChange={setUrlTitleOverride}
          />
        ) : null}

        {canIngest ? (
          <FormControlLabel
            sx={{ mt: 2 }}
            control={
              <Checkbox
                checked={confirmedIrreversible}
                onChange={(e) => setConfirmedIrreversible(e.target.checked)}
                disabled={overallBusy}
              />
            }
            label="I understand ingestion is irreversible and sources are immutable."
          />
        ) : null}
      </DialogContent>

      <DialogActions>
        <Button onClick={onDialogClose} disabled={overallBusy} sx={{ textTransform: 'none' }}>
          Close
        </Button>

        {tab === 'manual' ? (
          <Button
            variant="contained"
            disabled={!canIngest || overallBusy || !canSubmitManual || !confirmedIrreversible}
            onClick={async () => {
              reset();
              const res = await ingestOne({
                title: manualTitle,
                source: { kind: 'manual' },
                text: manualText,
              });
              if (res?.documentId) {
                onIngested(res.documentId);
                setManualTitle('');
                setManualText('');
              }
            }}
          >
            Ingest
          </Button>
        ) : null}

        {tab === 'file' ? (
          <Button
            variant="contained"
            disabled={!canIngest || overallBusy || fileRows.length === 0 || !confirmedIrreversible}
            onClick={async () => {
              setFilesError(null);
              reset();
              setFilesBusy(true);
              try {
                const rows = [...fileRows];
                let lastCreatedDocumentId: string | null = null;
                for (let i = 0; i < rows.length; i += 1) {
                  rows[i] = { ...rows[i], status: 'parsing', message: undefined };
                  setFileRows([...rows]);

                  const f = rows[i].file;
                  const fileSha256 = await sha256HexOfFile(f);
                  const parsed = await parseFileToText(f);

                  rows[i] = { ...rows[i], status: 'ingesting' };
                  setFileRows([...rows]);

                  const res = await ingestOne({
                    title: parsed.title,
                    source: {
                      kind: 'file',
                      filename: f.name,
                      mimeType: f.type || 'application/octet-stream',
                      sizeBytes: f.size,
                      lastModifiedMs: f.lastModified,
                      fileSha256: fileSha256 ?? undefined,
                    },
                    text: parsed.text,
                  });

                  if (!res?.documentId) {
                    rows[i] = { ...rows[i], status: 'error', message: 'Ingestion failed.' };
                  } else {
                    lastCreatedDocumentId = res.documentId;
                    rows[i] = { ...rows[i], status: 'done', createdDocumentId: res.documentId };
                  }
                  setFileRows([...rows]);
                }

                // Only auto-close after the full batch completes (multi-file safe).
                if (lastCreatedDocumentId) {
                  onIngested(lastCreatedDocumentId);
                }
              } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'File ingestion failed.';
                setFilesError(msg);
              } finally {
                setFilesBusy(false);
              }
            }}
          >
            Ingest files
          </Button>
        ) : null}

        {tab === 'url' ? (
          <Button
            variant="contained"
            disabled={!canIngest || overallBusy || url.trim().length === 0 || !confirmedIrreversible}
            onClick={async () => {
              setUrlError(null);
              reset();
              setUrlBusy(true);
              try {
                const imported = await importUrlToText(url.trim());
                const title = urlTitleOverride.trim() || imported.title || url.trim();
                const accessedAtIso = new Date().toISOString();
                const res = await ingestOne({
                  title,
                  source: {
                    kind: 'url',
                    url: url.trim(),
                    accessedAtIso,
                    fetchedUrl: imported.fetchedUrl,
                    contentType: imported.contentType,
                    publisher: imported.publisher,
                    publishedAtIso: imported.publishedAtIso,
                    author: imported.author,
                  },
                  text: imported.text,
                });
                if (res?.documentId) {
                  onIngested(res.documentId);
                  setUrl('');
                  setUrlTitleOverride('');
                }
              } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'URL import failed.';
                setUrlError(msg);
              } finally {
                setUrlBusy(false);
              }
            }}
          >
            Import & ingest
          </Button>
        ) : null}
      </DialogActions>
    </Dialog>
  );
}

