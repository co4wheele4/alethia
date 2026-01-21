/**
 * Document Detail (read-only).
 *
 * Shows:
 * - provenance (source summary)
 * - chunks (raw text)
 * - extracted mentions with offsets (highlighted) and entity linkage
 */
'use client';

import Link from 'next/link';
import { useQuery } from '@apollo/client/react';
import { Alert, Box, Chip, Divider, LinearProgress, Stack, Typography } from '@mui/material';

import { AppShell, ContentSurface } from '../../components/layout';
import { GET_DOCUMENT_BY_ID_QUERY } from '@/src/graphql';

type Mention = {
  id: string;
  entityId: string;
  startOffset: number | null;
  endOffset: number | null;
  excerpt: string | null;
  entity: { id: string; name: string; type: string; mentionCount: number };
};

type Chunk = {
  id: string;
  chunkIndex: number;
  content: string;
  mentions: Mention[];
};

type GetDocumentByIdResult = {
  document: {
    id: string;
    title: string;
    createdAt: string;
    sourceType: string | null;
    sourceLabel: string | null;
    source: {
      kind: string;
      filename: string | null;
      mimeType: string | null;
      requestedUrl: string | null;
      fetchedUrl: string | null;
      contentSha256: string | null;
      fileSha256: string | null;
      ingestedAt: string | null;
      publishedAt: string | null;
      author: string | null;
      publisher: string | null;
    } | null;
    chunks: Chunk[];
  } | null;
};

function formatDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().replace('.000Z', 'Z');
}

function highlightContent(content: string, mentions: Mention[]) {
  const spans = mentions
    .map((m) => ({
      id: m.id,
      start: m.startOffset,
      end: m.endOffset,
      label: m.entity?.name ?? m.entityId,
    }))
    .filter((s) => typeof s.start === 'number' && typeof s.end === 'number')
    .map((s) => ({ ...s, start: s.start as number, end: s.end as number }))
    .filter((s) => s.start >= 0 && s.end <= content.length && s.end > s.start)
    .sort((a, b) => a.start - b.start || a.end - b.end);

  // If spans overlap, prefer earlier spans and skip later overlaps to avoid misleading highlighting.
  const nonOverlapping: typeof spans = [];
  for (const s of spans) {
    const prev = nonOverlapping[nonOverlapping.length - 1];
    if (!prev || s.start >= prev.end) nonOverlapping.push(s);
  }

  if (nonOverlapping.length === 0) return content;

  const out: React.ReactNode[] = [];
  let cursor = 0;
  for (const s of nonOverlapping) {
    if (cursor < s.start) out.push(content.slice(cursor, s.start));
    out.push(
      <mark key={s.id} style={{ padding: '0 2px' }} title={`${s.label} [${s.start}, ${s.end})`}>
        {content.slice(s.start, s.end)}
      </mark>
    );
    cursor = s.end;
  }
  if (cursor < content.length) out.push(content.slice(cursor));
  return out;
}

export default function DocumentDetailPage({ params }: { params: { id: string } }) {
  const { data, loading, error } = useQuery<GetDocumentByIdResult>(GET_DOCUMENT_BY_ID_QUERY, {
    variables: { id: params.id },
  });

  const doc = data?.document ?? null;

  const entities = (() => {
    const byId = new Map<string, Mention['entity']>();
    for (const c of doc?.chunks ?? []) {
      for (const m of c.mentions) byId.set(m.entity.id, m.entity);
    }
    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
  })();

  return (
    <AppShell title="Document">
      <ContentSurface>
        {loading ? (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Loading document…
            </Typography>
            <LinearProgress />
          </Box>
        ) : null}

        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error.message}
          </Alert>
        ) : null}

        {!loading && !error && !doc ? (
          <Alert severity="info">Document not found.</Alert>
        ) : null}

        {doc ? (
          <Stack spacing={2}>
            <Box>
              <Typography variant="h6" gutterBottom>
                {doc.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Created: {formatDateTime(doc.createdAt)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Provenance: {doc.sourceType ?? 'UNKNOWN'} • {doc.sourceLabel ?? 'unknown'}
              </Typography>
            </Box>

            <Divider />

            <Box>
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
                      Filename: {doc.source.filename} ({doc.source.mimeType ?? 'unknown'})
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
                  {(doc.source.author || doc.source.publisher) && (
                    <Typography variant="body2" color="text.secondary">
                      Author/Publisher: {doc.source.author ?? 'unknown'} / {doc.source.publisher ?? 'unknown'}
                    </Typography>
                  )}
                  {(doc.source.contentSha256 || doc.source.fileSha256) && (
                    <Typography variant="body2" color="text.secondary">
                      SHA-256: content={doc.source.contentSha256 ?? 'n/a'} • file={doc.source.fileSha256 ?? 'n/a'}
                    </Typography>
                  )}
                </Stack>
              ) : (
                <Alert severity="warning">This document has no source metadata (epistemically incomplete).</Alert>
              )}
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Extracted entities
              </Typography>
              {entities.length === 0 ? (
                <Alert severity="info">No extracted entities are linked via mentions in this document.</Alert>
              ) : (
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  {entities.map((e) => (
                    <Chip
                      key={e.id}
                      component={Link}
                      href={`/entities/${e.id}`}
                      clickable
                      label={`${e.name} (${e.type})`}
                      variant="outlined"
                      sx={{ textTransform: 'none' }}
                    />
                  ))}
                </Stack>
              )}
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Chunks (evidence surface)
              </Typography>

              <Stack spacing={2}>
                {doc.chunks
                  .slice()
                  .sort((a, b) => a.chunkIndex - b.chunkIndex)
                  .map((c) => (
                    <Box key={c.id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Chunk {c.chunkIndex} • {c.mentions.length} mention(s)
                      </Typography>

                      <Typography
                        variant="body2"
                        component="div"
                        sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', mb: 1 }}
                      >
                        {highlightContent(c.content, c.mentions)}
                      </Typography>

                      {c.mentions.length > 0 ? (
                        <Stack spacing={0.5}>
                          {c.mentions
                            .slice()
                            .sort((a, b) => (a.startOffset ?? 0) - (b.startOffset ?? 0))
                            .map((m) => (
                              <Typography key={m.id} variant="caption" color="text.secondary">
                                Mention {m.id}: {m.entity.name} • offsets [{String(m.startOffset)}, {String(m.endOffset)}
                                ) • excerpt: {m.excerpt ?? 'n/a'}
                              </Typography>
                            ))}
                        </Stack>
                      ) : null}
                    </Box>
                  ))}
              </Stack>
            </Box>
          </Stack>
        ) : null}
      </ContentSurface>
    </AppShell>
  );
}

