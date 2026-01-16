'use client';

import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Checkbox,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';

import type { OnboardingState, ProvenanceType, ReviewPreview, StagedItem } from '../types';

function excerptOf(text: string, maxChars = 700) {
  const normalized = text.replace(/\s+\n/g, '\n').trim();
  if (normalized.length <= maxChars) return normalized;
  return `${normalized.slice(0, maxChars).trim()}…`;
}

function fmtBytes(bytes: number): string {
  if (!Number.isFinite(bytes)) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

const PROVENANCE_OPTIONS: Array<{ value: ProvenanceType; label: string }> = [
  { value: 'user-supplied', label: 'User-supplied' },
  { value: 'scraped', label: 'Scraped / crawled' },
  { value: 'archive', label: 'Archive' },
  { value: 'transcript', label: 'Transcript' },
  { value: 'public-record', label: 'Public record / report' },
  { value: 'other', label: 'Other' },
  { value: 'unsure', label: 'Not sure yet' },
];

export function ReviewStep(props: {
  staged: StagedItem[];
  review: OnboardingState['review'];
  ingestion: OnboardingState['ingestion'];
  ingestProgressNode?: React.ReactNode;
  disabled?: boolean;
  onUpdateItemTitle: (id: string, title: string) => void;
  onSetItemProvenance: (id: string, provenance: StagedItem['provenance']) => void;
  onRemoveStaged: (id: string) => void;
  onGeneratePreview: (id: string) => void;
  onSetIrreversibleConfirmed: (v: boolean) => void;
  onCommitIngestion: () => void;
}) {
  const {
    staged,
    review,
    ingestion,
    ingestProgressNode,
    disabled,
    onUpdateItemTitle,
    onSetItemProvenance,
    onRemoveStaged,
    onGeneratePreview,
    onSetIrreversibleConfirmed,
    onCommitIngestion,
  } = props;

  const count = staged.length;
  const previewsReady = staged.every((it) => Boolean(review.previewsById[it.id]));
  const canCommit = count > 0 && previewsReady && review.irreversibleConfirmed && ingestion.state !== 'running';
  const provenanceConfirmedCount = staged.filter((s) => s.provenance.confirmed).length;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h5">Ingestion review</Typography>

      <Alert severity="info">
        You’re previewing what will be ingested as an <strong>immutable snapshot</strong>. You can edit titles and
        provenance before committing. No analysis happens here.
      </Alert>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 320px' }, gap: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {count === 0 ? (
            <Alert severity="warning">No sources queued yet. You can still finish, or go back and add documents.</Alert>
          ) : null}

          {staged.map((it) => {
            const busy = Boolean(review.previewBusyById[it.id]);
            const err = review.previewErrorById[it.id];
            const preview: ReviewPreview | undefined = review.previewsById[it.id];

            return (
              <Card key={it.id} variant="outlined">
                <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {it.kind === 'file' ? 'File' : 'URL'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {it.kind === 'file' ? it.file.name : it.url}
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      variant="outlined"
                      sx={{ textTransform: 'none', whiteSpace: 'nowrap' }}
                      onClick={() => onRemoveStaged(it.id)}
                      disabled={disabled || ingestion.state === 'running'}
                    >
                      Remove
                    </Button>
                  </Box>

                  <TextField
                    label="Title"
                    value={it.title}
                    onChange={(e) => onUpdateItemTitle(it.id, e.target.value)}
                    disabled={disabled || ingestion.state === 'running'}
                    helperText="Used as the document title in the index."
                  />

                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1 }}>
                    <FormControl disabled={disabled || ingestion.state === 'running'}>
                      <InputLabel id={`review-item-prov-type-${it.id}`}>Provenance type</InputLabel>
                      <Select
                        labelId={`review-item-prov-type-${it.id}`}
                        label="Provenance type"
                        value={it.provenance.type ?? ''}
                        onChange={(e) => {
                          const nextType = (e.target.value || null) as ProvenanceType | null;
                          onSetItemProvenance(it.id, { ...it.provenance, type: nextType, confirmed: false });
                        }}
                      >
                        <MenuItem value="">
                          <em>Unset</em>
                        </MenuItem>
                        {PROVENANCE_OPTIONS.map((o) => (
                          <MenuItem key={o.value} value={o.value}>
                            {o.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <TextField
                      label="Provenance label (optional)"
                      value={it.provenance.label}
                      onChange={(e) => onSetItemProvenance(it.id, { ...it.provenance, label: e.target.value })}
                      disabled={disabled || ingestion.state === 'running'}
                    />
                  </Box>

                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={it.provenance.confirmed}
                        disabled={disabled || ingestion.state === 'running' || !it.provenance.type}
                        onChange={(e) => onSetItemProvenance(it.id, { ...it.provenance, confirmed: e.target.checked })}
                      />
                    }
                    label="I confirm this describes how the source was obtained."
                  />

                  <Divider />

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      Metadata (pre-ingestion)
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {it.kind === 'file'
                        ? `Size: ${fmtBytes(it.file.size)} • Type: ${it.file.type || 'unknown'} • Modified: ${new Date(
                            it.file.lastModified
                          ).toLocaleString()}`
                        : `Reference: ${it.url}`}
                    </Typography>
                  </Box>

                  {err ? (
                    <Alert severity="error" sx={{ mt: 1 }}>
                      {err}
                    </Alert>
                  ) : null}

                  {busy ? <LinearProgress aria-label="preview busy" /> : null}

                  {preview ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        Parsed preview (what will be ingested)
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Chunks: {preview.stats.chunkCount} • Characters: {preview.stats.characters} • Words:{' '}
                        {preview.stats.words}
                        {typeof preview.stats.csvRows === 'number' ? ` • CSV rows (approx): ${preview.stats.csvRows}` : ''}
                      </Typography>

                      {preview.urlMeta ? (
                        <Typography variant="caption" color="text.secondary">
                          fetchedUrl: {preview.urlMeta.fetchedUrl}
                          {preview.urlMeta.contentType ? ` • contentType: ${preview.urlMeta.contentType}` : ''}
                          {preview.urlMeta.publisher ? ` • publisher: ${preview.urlMeta.publisher}` : ''}
                        </Typography>
                      ) : null}

                      {preview.fileMeta?.fileSha256 ? (
                        <Typography variant="caption" color="text.secondary">
                          fileSha256: {preview.fileMeta.fileSha256}
                        </Typography>
                      ) : null}

                      <Box
                        sx={{
                          p: 1.5,
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                          bgcolor: 'background.default',
                        }}
                      >
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                          {excerptOf(preview.text)}
                        </Typography>
                      </Box>
                    </Box>
                  ) : (
                    <Alert severity="warning">
                      No preview yet. Generate a preview so you can confirm what will be ingested.
                    </Alert>
                  )}
                </CardContent>

                <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
                  <Button
                    variant="contained"
                    sx={{ textTransform: 'none' }}
                    onClick={() => onGeneratePreview(it.id)}
                    disabled={disabled || busy || ingestion.state === 'running'}
                  >
                    {it.kind === 'file' ? 'Generate preview' : 'Fetch & preview'}
                  </Button>
                </CardActions>
              </Card>
            );
          })}
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Card variant="outlined">
            <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                Review summary
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Documents queued: {count}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Provenance confirmed: {provenanceConfirmedCount}/{count}
              </Typography>

              <Divider />

              <Divider />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={review.irreversibleConfirmed}
                    onChange={(e) => onSetIrreversibleConfirmed(e.target.checked)}
                    disabled={disabled || ingestion.state === 'running'}
                  />
                }
                label="I understand ingestion is irreversible and sources are immutable."
              />

              {ingestion.state === 'error' ? <Alert severity="error">{ingestion.errorMessage ?? 'Ingestion failed.'}</Alert> : null}
              {ingestProgressNode ? <Box>{ingestProgressNode}</Box> : null}

              <Button
                variant="contained"
                sx={{ textTransform: 'none' }}
                disabled={!canCommit}
                onClick={onCommitIngestion}
              >
                Commit ingestion
              </Button>

              {!previewsReady && count > 0 ? (
                <Typography variant="caption" color="text.secondary">
                  Tip: commit is enabled after every queued item has a preview.
                </Typography>
              ) : null}
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}

