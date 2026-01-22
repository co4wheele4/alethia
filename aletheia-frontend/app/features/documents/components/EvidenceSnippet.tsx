'use client';

import Link from 'next/link';
import { Alert, Box, Chip, Stack, Typography } from '@mui/material';

type MentionLink = {
  __typename?: 'EntityRelationshipEvidenceMention';
  evidenceId: string;
  mentionId: string;
  mention: {
    __typename?: 'EntityMention';
    id: string;
    entityId: string;
    chunkId: string;
    startOffset?: number | null;
    endOffset?: number | null;
    excerpt?: string | null;
    entity: { __typename?: 'Entity'; id: string; name: string; type: string; mentionCount: number };
  };
};

type Evidence = {
  __typename?: 'EntityRelationshipEvidence';
  id: string;
  kind: string;
  createdAt: string;
  chunkId: string;
  startOffset?: number | null;
  endOffset?: number | null;
  quotedText?: string | null;
  chunk: {
    __typename?: 'DocumentChunk';
    id: string;
    chunkIndex: number;
    content: string;
    documentId: string;
    document: { __typename?: 'Document'; id: string; title: string; createdAt: string; sourceType?: string | null; sourceLabel?: string | null };
  };
  mentionLinks: MentionLink[];
};

function sliceByOffsets(content: string, start: number | null | undefined, end: number | null | undefined) {
  if (typeof start !== 'number' || typeof end !== 'number') return null;
  if (start < 0 || end <= start || end > content.length) return null;
  return content.slice(start, end);
}

export function EvidenceSnippet(props: { evidence: Evidence }) {
  const { evidence } = props;
  const content = evidence.chunk?.content ?? '';
  const sliced = sliceByOffsets(content, evidence.startOffset, evidence.endOffset);
  const hasOffsets = typeof evidence.startOffset === 'number' && typeof evidence.endOffset === 'number';

  return (
    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
        Evidence ID: {evidence.id} • Kind: {evidence.kind} • Created: {evidence.createdAt}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
        Document: <Link href={`/documents/${evidence.chunk.documentId}`}>{evidence.chunk.document.title}</Link> • Chunk{' '}
        {evidence.chunk.chunkIndex} (chunkId={evidence.chunkId})
      </Typography>

      {sliced ? (
        <Typography
          variant="body2"
          component="pre"
          sx={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--font-geist-mono)', mt: 1, mb: 0 }}
        >
          {sliced}
        </Typography>
      ) : (
        <>
          <Alert severity="warning" sx={{ mt: 1 }}>
            Evidence offsets could not be applied{hasOffsets ? ` ([${String(evidence.startOffset)}, ${String(evidence.endOffset)}) )` : ''}.
            Showing raw chunk text.
          </Alert>
          <Typography
            variant="body2"
            component="pre"
            sx={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--font-geist-mono)', mt: 1, mb: 0 }}
          >
            {content}
          </Typography>
        </>
      )}

      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1 }}>
        {(evidence.mentionLinks ?? []).length === 0 ? (
          <Chip size="small" label="No mention links" variant="outlined" />
        ) : (
          evidence.mentionLinks.map((ml) => (
            <Chip
              key={ml.mentionId}
              size="small"
              variant="outlined"
              label={`mention:${ml.mentionId} (${ml.mention.entity.name})`}
            />
          ))
        )}
      </Stack>
    </Box>
  );
}

