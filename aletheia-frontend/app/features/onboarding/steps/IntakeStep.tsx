'use client';

import {
  Alert,
  Box,
  Button,
  Divider,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from '@mui/material';

import { FileDropZone } from '../../documents/components/FileDropZone';
import type { IntakeMode, StagedItem } from '../types';

const ACCEPT = ['.pdf', '.docx', '.txt', '.md', '.markdown', '.csv', '.html', '.htm'].join(',');

export function IntakeStep(props: {
  mode: IntakeMode;
  staged: StagedItem[];
  urlDraft: { url: string; title: string };
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  disabled?: boolean;
  onModeChange: (mode: IntakeMode) => void;
  onAddFiles: (files: FileList) => void;
  onRemoveStaged: (id: string) => void;
  onUrlDraftChange: (draft: { url: string; title: string }) => void;
  onAddUrl: () => void;
}) {
  const {
    mode,
    staged,
    urlDraft,
    fileInputRef,
    disabled,
    onModeChange,
    onAddFiles,
    onRemoveStaged,
    onUrlDraftChange,
    onAddUrl,
  } = props;

  const stagedFiles = staged.filter((s) => s.kind === 'file');
  const stagedUrls = staged.filter((s) => s.kind === 'url');

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h5">Document intake</Typography>

      <Alert severity="info">
        This step only <strong>queues</strong> sources. Nothing is parsed, fetched, or ingested yet.
      </Alert>

      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
          Choose an intake method
        </Typography>
        <FormControl>
          <RadioGroup
            row
            value={mode}
            onChange={(e) => onModeChange(e.target.value as IntakeMode)}
            aria-label="intake method"
          >
            <FormControlLabel value="file" control={<Radio />} label="Upload file(s)" disabled={disabled} />
            <FormControlLabel value="url" control={<Radio />} label="Register external reference (URL)" disabled={disabled} />
          </RadioGroup>
        </FormControl>
      </Box>

      {mode === 'file' ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Supported formats
            </Typography>
            <Typography variant="body2" color="text.secondary">
              PDF, DOCX, TXT/MD, CSV, HTML.
            </Typography>
          </Box>

          <FileDropZone
            disabled={disabled}
            accept={ACCEPT}
            inputRef={fileInputRef}
            onAddFiles={(files) => onAddFiles(files)}
          />

          {stagedFiles.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Divider />
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Queued files ({stagedFiles.length})
              </Typography>
              {stagedFiles.map((it) => (
                <Box
                  key={it.id}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 2,
                    p: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                      {it.file.name ?? 'File'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Will be reviewed before ingestion.
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    variant="outlined"
                    sx={{ textTransform: 'none', whiteSpace: 'nowrap' }}
                    onClick={() => onRemoveStaged(it.id)}
                    disabled={disabled}
                  >
                    Remove
                  </Button>
                </Box>
              ))}
            </Box>
          ) : null}
        </Box>
      ) : null}

      {mode === 'url' ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Alert severity="info">
            Registering a URL is a reference, not a claim. You’ll confirm a <strong>snapshot preview</strong> before
            ingestion.
          </Alert>

          <TextField
            label="URL"
            value={urlDraft.url}
            onChange={(e) => onUrlDraftChange({ ...urlDraft, url: e.target.value })}
            disabled={disabled}
            placeholder="https://example.com/article"
            inputProps={{ inputMode: 'url' }}
          />
          <TextField
            label="Title (optional)"
            value={urlDraft.title}
            onChange={(e) => onUrlDraftChange({ ...urlDraft, title: e.target.value })}
            disabled={disabled}
            placeholder="Short label for your own reference"
          />

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              sx={{ textTransform: 'none' }}
              disabled={disabled || urlDraft.url.trim().length === 0}
              onClick={onAddUrl}
            >
              Add URL to queue
            </Button>
            <Button
              variant="text"
              sx={{ textTransform: 'none' }}
              disabled={disabled || (urlDraft.url.trim().length === 0 && urlDraft.title.trim().length === 0)}
              onClick={() => onUrlDraftChange({ url: '', title: '' })}
            >
              Clear
            </Button>
          </Box>

          {stagedUrls.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Divider />
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Queued URLs ({stagedUrls.length})
              </Typography>
              {stagedUrls.map((it) => (
                <Box
                  key={it.id}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 2,
                    p: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                      {it.title || it.url}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {it.url}
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    variant="outlined"
                    sx={{ textTransform: 'none', whiteSpace: 'nowrap' }}
                    onClick={() => onRemoveStaged(it.id)}
                    disabled={disabled}
                  >
                    Remove
                  </Button>
                </Box>
              ))}
            </Box>
          ) : null}
        </Box>
      ) : null}
    </Box>
  );
}

