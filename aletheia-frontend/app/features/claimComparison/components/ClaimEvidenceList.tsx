'use client';

/**
 * ClaimEvidenceList — evidence presentation for claim comparison (ADR-020).
 * Renders verbatim snippets with source reference and locator context. No summarization or interpretation.
 */
import { Alert, Box, Divider, List, ListItem, Stack, Typography } from '@mui/material';
import { alpha, lighten } from '@mui/material/styles';

import { ClaimEvidenceSnippet, type ClaimEvidenceSnippetModel } from './ClaimEvidenceSnippet';

export type ClaimEvidenceListModel = {
  /**
   * Renderable, offset-grounded snippets. These are derived strictly from schema fields
   * and MUST be shown exactly as returned (no confidence, no conflict inference).
   */
  snippets: ClaimEvidenceSnippetModel[];

  /**
   * Relationship IDs referenced by ClaimEvidence.relationshipIds that have zero evidence anchors.
   * This is not a schema violation (legacy relationships can exist without anchors) but must be explicit.
   */
  relationshipsWithNoEvidence: string[];

  /**
   * While relationship data is loading, we keep the UI evidence-first by explicitly showing
   * that relationship evidence is pending.
   */
  relationshipsPending: string[];
};

function groupSnippetsByDocument(snippets: ClaimEvidenceSnippetModel[]) {
  const groups = new Map<string, ClaimEvidenceSnippetModel[]>();
  for (const s of snippets ?? []) {
    const arr = groups.get(s.documentId) ?? [];
    arr.push(s);
    groups.set(s.documentId, arr);
  }
  for (const [k, v] of groups) {
    groups.set(
      k,
      v.slice().sort((a, b) => {
        if (a.chunkIndex !== b.chunkIndex) return a.chunkIndex - b.chunkIndex;
        return a.startOffset - b.startOffset;
      })
    );
  }
  return groups;
}

export function ClaimEvidenceList(props: { model: ClaimEvidenceListModel }) {
  const { model } = props;
  const grouped = groupSnippetsByDocument(model.snippets);
  const docIds = [...grouped.keys()].sort();

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        p: 2,
        bgcolor: (theme) => alpha(lighten(theme.palette.background.default, 0.2), 0.72),
      }}
    >
      <Stack direction="row" alignItems="baseline" justifyContent="space-between" spacing={2}>
        <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
          Evidence
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {model.snippets.length} snippet{model.snippets.length === 1 ? '' : 's'}
        </Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        Evidence is displayed exactly as returned by GraphQL. No conflict or agreement is inferred.
      </Typography>

      <Divider sx={{ my: 2 }} />

      {model.snippets.length === 0 && model.relationshipsWithNoEvidence.length === 0 && model.relationshipsPending.length === 0 ? (
        <Alert severity="info">No evidence provided.</Alert>
      ) : (
        <Stack spacing={2}>
          {model.relationshipsPending.length > 0 ? (
            <Alert severity="info">Loading relationship evidence…</Alert>
          ) : null}

          {model.relationshipsWithNoEvidence.length > 0 ? (
            <Alert severity="info">
              No evidence provided for relationship{model.relationshipsWithNoEvidence.length === 1 ? '' : 's'}:{' '}
              {model.relationshipsWithNoEvidence.join(', ')}
            </Alert>
          ) : null}

          {docIds.map((docId) => {
            const snippets = grouped.get(docId) ?? [];
            const title = snippets[0]?.documentTitle ?? docId;
            return (
              <Box key={docId} sx={{ border: '1px dashed', borderColor: 'divider', borderRadius: 2, p: 1.5, minWidth: 0 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }} noWrap>
                  Source document: {title}
                </Typography>

                <List dense aria-label={`claim-evidence-document-${docId}`} sx={{ mt: 1 }}>
                  {snippets.map((s) => (
                    <ListItem
                      key={`${s.kind}:${s.documentId}:${s.chunkIndex}:${s.startOffset}:${s.endOffset}:${'mentionId' in s ? s.mentionId : s.anchorId}`}
                      disableGutters
                      sx={{ display: 'block', py: 1 }}
                    >
                      <ClaimEvidenceSnippet item={s} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}

