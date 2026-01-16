'use client';

import {
  Alert,
  Box,
  Checkbox,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';

import type { ProvenanceType, StagedItem } from '../types';

const PROVENANCE_OPTIONS: Array<{ value: ProvenanceType; label: string; helper: string }> = [
  { value: 'user-supplied', label: 'User-supplied', helper: 'You provided the source directly (files, notes, exports).' },
  { value: 'scraped', label: 'Scraped / crawled', helper: 'Collected from the web by a tool or script.' },
  { value: 'archive', label: 'Archive', helper: 'Pulled from an archive, repository, or dataset.' },
  { value: 'transcript', label: 'Transcript', helper: 'Derived from audio/video via transcription.' },
  { value: 'public-record', label: 'Public record / report', helper: 'Issued by an organization or registry.' },
  { value: 'other', label: 'Other', helper: 'Something else (describe in the label field).' },
  { value: 'unsure', label: 'Not sure yet', helper: 'Leave this unset for now; you can edit it later.' },
];

export function ProvenanceStep(props: {
  staged: StagedItem[];
  disabled?: boolean;
  onSetItemProvenance: (id: string, next: { type: ProvenanceType | null; label: string; confirmed: boolean }) => void;
}) {
  const { staged, disabled, onSetItemProvenance } = props;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h5">Provenance classification</Typography>

      <Alert severity="info">
        This is about <strong>how you obtained the source</strong>, not what the source “means.” You can skip this step,
        but nothing here is auto-inferred.
      </Alert>

      {staged.length === 0 ? (
        <Alert severity="warning">No sources queued yet. Add documents first, then classify provenance.</Alert>
      ) : null}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {staged.map((it) => {
          const selected = it.provenance.type ? PROVENANCE_OPTIONS.find((o) => o.value === it.provenance.type) : null;
          return (
            <Box
              key={it.id}
              sx={{
                p: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }} noWrap>
                  {it.title || (it.kind === 'file' ? it.file.name : it.url)}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                  {it.kind === 'file' ? it.file.name : it.url}
                </Typography>
              </Box>

              <FormControl disabled={disabled}>
                <InputLabel id={`prov-type-label-${it.id}`}>Source type</InputLabel>
                <Select
                  labelId={`prov-type-label-${it.id}`}
                  label="Source type"
                  value={it.provenance.type ?? ''}
                  onChange={(e) => {
                    const nextType = (e.target.value || null) as ProvenanceType | null;
                    onSetItemProvenance(it.id, { ...it.provenance, type: nextType, confirmed: false });
                  }}
                >
                  <MenuItem value="">
                    <em>Unset (skip for now)</em>
                  </MenuItem>
                  {PROVENANCE_OPTIONS.map((o) => (
                    <MenuItem key={o.value} value={o.value}>
                      {o.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Optional source label"
                value={it.provenance.label}
                onChange={(e) => onSetItemProvenance(it.id, { ...it.provenance, label: e.target.value })}
                disabled={disabled}
                placeholder="e.g., “FOIA release”, “RSS feed”, “court docket export”"
                helperText={selected ? selected.helper : 'Short, human-readable context you want stored with the source.'}
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={it.provenance.confirmed}
                    disabled={disabled || !it.provenance.type}
                    onChange={(e) => onSetItemProvenance(it.id, { ...it.provenance, confirmed: e.target.checked })}
                  />
                }
                label="I confirm this describes how the source was obtained."
              />

              <Divider />
              <Typography variant="caption" color="text.secondary">
                This metadata will be stored in the document’s immutable provenance header (chunk 0).
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

