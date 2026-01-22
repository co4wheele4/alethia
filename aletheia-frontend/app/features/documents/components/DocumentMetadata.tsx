'use client';

import { Alert, Box, Divider, Stack, Typography } from '@mui/material';

type DocumentSource = {
  __typename?: 'DocumentSource';
  id: string;
  kind: string;
  ingestedAt?: string | null;
  accessedAt?: string | null;
  publishedAt?: string | null;
  author?: string | null;
  publisher?: string | null;
  filename?: string | null;
  mimeType?: string | null;
  contentType?: string | null;
  sizeBytes?: number | null;
  requestedUrl?: string | null;
  fetchedUrl?: string | null;
  contentSha256?: string | null;
  fileSha256?: string | null;
  lastModifiedMs?: string | null;
};

type Document = {
  __typename?: 'Document';
  id: string;
  title: string;
  createdAt: string;
  sourceType?: string | null;
  sourceLabel?: string | null;
  source?: DocumentSource | null;
};

function formatDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().replace('.000Z', 'Z');
}

export function DocumentMetadata(props: { document: Document }) {
  const { document: doc } = props;

  const missingSummary = !doc.sourceType || !doc.sourceLabel;

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {doc.title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Created: {formatDateTime(doc.createdAt)}
      </Typography>

      <Typography variant="body2" color="text.secondary">
        Status: not exposed by the API (no schema field)
      </Typography>

      <Divider sx={{ my: 2 }} />

      <Typography variant="subtitle2" gutterBottom>
        Provenance summary
      </Typography>

      {missingSummary ? (
        <Alert severity="warning" sx={{ mb: 1 }}>
          This document is missing provenance summary fields (sourceType/sourceLabel are null). The UI will not guess.
        </Alert>
      ) : null}

      <Typography variant="body2" color="text.secondary">
        Source type: {doc.sourceType ?? '(missing)'}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Source label: {doc.sourceLabel ?? '(missing)'}
      </Typography>

      <Divider sx={{ my: 2 }} />

      <Typography variant="subtitle2" gutterBottom>
        Source details
      </Typography>

      {doc.source ? (
        <Stack spacing={0.5}>
          <Typography variant="body2" color="text.secondary">
            Kind: {doc.source.kind}
          </Typography>
          {doc.source.requestedUrl ? (
            <Typography variant="body2" color="text.secondary">
              Requested URL: {doc.source.requestedUrl}
            </Typography>
          ) : null}
          {doc.source.fetchedUrl ? (
            <Typography variant="body2" color="text.secondary">
              Fetched URL: {doc.source.fetchedUrl}
            </Typography>
          ) : null}
          {doc.source.filename ? (
            <Typography variant="body2" color="text.secondary">
              Filename: {doc.source.filename} ({doc.source.mimeType ?? '(missing mimeType)'})
            </Typography>
          ) : null}
          {doc.source.ingestedAt ? (
            <Typography variant="body2" color="text.secondary">
              Ingested at: {formatDateTime(doc.source.ingestedAt)}
            </Typography>
          ) : null}
          {doc.source.publishedAt ? (
            <Typography variant="body2" color="text.secondary">
              Published at: {formatDateTime(doc.source.publishedAt)}
            </Typography>
          ) : null}
          {(doc.source.author || doc.source.publisher) ? (
            <Typography variant="body2" color="text.secondary">
              Author/Publisher: {doc.source.author ?? '(missing)'} / {doc.source.publisher ?? '(missing)'}
            </Typography>
          ) : null}
          {(doc.source.contentSha256 || doc.source.fileSha256) ? (
            <Typography variant="body2" color="text.secondary">
              SHA-256: content={doc.source.contentSha256 ?? '(missing)'} • file={doc.source.fileSha256 ?? '(missing)'}
            </Typography>
          ) : null}
        </Stack>
      ) : (
        <Alert severity="warning">This document has no source metadata (`Document.source` is null).</Alert>
      )}
    </Box>
  );
}

