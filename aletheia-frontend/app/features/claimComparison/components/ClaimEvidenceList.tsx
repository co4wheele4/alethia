'use client';

import Link from 'next/link';
import { Alert, Box, Button, Divider, List, ListItem, ListItemText, Stack, Typography } from '@mui/material';

import type { ClaimComparisonClaim, ClaimComparisonDocument, ClaimComparisonMention } from '../hooks/useClaimsForComparison';
import { MentionHighlight } from './MentionHighlight';

type MentionRef = {
  mention: ClaimComparisonMention;
  document: ClaimComparisonDocument;
  chunkIndex: number;
  chunkText: string;
};

function indexMentionsById(documents: ClaimComparisonDocument[]) {
  const byId = new Map<string, MentionRef>();
  for (const doc of documents ?? []) {
    for (const chunk of doc.chunks ?? []) {
      for (const mention of chunk.mentions ?? []) {
        byId.set(mention.id, {
          mention,
          document: doc,
          chunkIndex: chunk.chunkIndex,
          chunkText: chunk.content ?? '',
        });
      }
    }
  }
  return byId;
}

function groupMentionIdsByDocument(claim: ClaimComparisonClaim) {
  const groups = new Map<string, Set<string>>();
  for (const ev of claim.evidence ?? []) {
    const set = groups.get(ev.documentId) ?? new Set<string>();
    for (const mentionId of ev.mentionIds ?? []) set.add(mentionId);
    groups.set(ev.documentId, set);
  }
  return groups;
}

export function ClaimEvidenceList(props: { claim: ClaimComparisonClaim }) {
  const { claim } = props;

  const docById = new Map<string, ClaimComparisonDocument>((claim.documents ?? []).map((d) => [d.id, d]));
  const mentionIndex = indexMentionsById(claim.documents ?? []);
  const grouped = groupMentionIdsByDocument(claim);

  const docIds = [...grouped.keys()].sort();

  if (docIds.length === 0) {
    return <Alert severity="error">Contract violation: claim has no evidence document references.</Alert>;
  }

  return (
    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2, bgcolor: 'background.paper' }}>
      <Stack direction="row" alignItems="baseline" justifyContent="space-between" spacing={2}>
        <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
          Evidence (grouped by document)
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {claim.evidence.length} anchor{claim.evidence.length === 1 ? '' : 's'}
        </Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        Evidence is displayed exactly as returned by GraphQL. No conflict or agreement is inferred.
      </Typography>

      <Divider sx={{ my: 2 }} />

      <Stack spacing={2}>
        {docIds.map((docId) => {
          const doc = docById.get(docId) ?? null;
          const mentionIds = [...(grouped.get(docId) ?? new Set())].sort();

          if (!doc) {
            return (
              <Alert key={docId} severity="error">
                Contract violation: evidence references documentId={docId}, but it is missing from Claim.documents.
              </Alert>
            );
          }

          return (
            <Box key={docId} sx={{ border: '1px dashed', borderColor: 'divider', borderRadius: 2, p: 1.5 }}>
              <Stack direction="row" alignItems="baseline" justifyContent="space-between" spacing={2} sx={{ minWidth: 0 }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }} noWrap>
                    Source document: <Link href={`/documents/${doc.id}`}>{doc.title}</Link>
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    documentId={doc.id}
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {mentionIds.length} mention{mentionIds.length === 1 ? '' : 's'}
                </Typography>
              </Stack>

              <List dense aria-label={`claim-evidence-document-${claim.id}-${doc.id}`} sx={{ mt: 1 }}>
                {mentionIds.map((mentionId) => {
                  const ref = mentionIndex.get(mentionId) ?? null;
                  if (!ref) {
                    return (
                      <ListItem key={mentionId} disableGutters>
                        <ListItemText
                          primary={<Typography variant="body2">mentionId={mentionId}</Typography>}
                          secondary="Missing mention record in Document.chunks[].mentions (cannot render offsets)."
                          secondaryTypographyProps={{ variant: 'caption' }}
                        />
                      </ListItem>
                    );
                  }

                  const href = `/documents?documentId=${encodeURIComponent(ref.document.id)}&chunk=${encodeURIComponent(
                    String(ref.chunkIndex)
                  )}&mentionId=${encodeURIComponent(ref.mention.id)}`;

                  return (
                    <ListItem key={mentionId} disableGutters alignItems="flex-start" sx={{ flexDirection: 'column', gap: 1 }}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2} sx={{ width: '100%' }}>
                        <ListItemText
                          primary={
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              Mention • chunk {ref.chunkIndex}
                            </Typography>
                          }
                          secondary={`entity=${ref.mention.entity?.name ?? ref.mention.entityId}`}
                          secondaryTypographyProps={{ variant: 'caption' }}
                          sx={{ m: 0 }}
                        />
                        <Button component={Link} href={href} size="small" sx={{ textTransform: 'none' }}>
                          Open source
                        </Button>
                      </Stack>

                      <MentionHighlight
                        mentionId={ref.mention.id}
                        chunkText={ref.chunkText}
                        startOffset={ref.mention.startOffset}
                        endOffset={ref.mention.endOffset}
                        excerpt={ref.mention.excerpt}
                      />
                    </ListItem>
                  );
                })}
              </List>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}

