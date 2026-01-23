'use client';

import Link from 'next/link';
import CloseIcon from '@mui/icons-material/Close';
import {
  Alert,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';

import { ImmutableRecordBadge } from '../../integrity/components/ImmutableRecordBadge';
import type { Claim, ClaimEvidence } from '../hooks/useClaims';
import { ClaimStatusBadge } from './ClaimStatusBadge';

function evidenceLabel(ev: ClaimEvidence) {
  const parts: string[] = [];
  parts.push(`doc=${ev.documentId}`);
  if (ev.mentionIds.length) parts.push(`mentions=${ev.mentionIds.length}`);
  if (ev.relationshipIds.length) parts.push(`relationships=${ev.relationshipIds.length}`);
  return parts.join(' • ');
}

function evidenceHref(ev: ClaimEvidence) {
  const docId = encodeURIComponent(ev.documentId);
  const mentionId = ev.mentionIds[0] ? encodeURIComponent(ev.mentionIds[0]) : null;
  if (mentionId) return `/documents?documentId=${docId}&mentionId=${mentionId}`;
  // Fallback: evidence is still reachable via document inspection.
  return `/documents/${docId}`;
}

export function ClaimDetailDrawer(props: { open: boolean; claim: Claim | null; onClose: () => void }) {
  const { open, claim, onClose } = props;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', md: 720 }, maxWidth: '100vw' } }}
      aria-label="Claim detail drawer"
    >
      <Box sx={{ p: 2, minWidth: 0 }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5, flexWrap: 'wrap' }}>
              <Typography variant="h6">Claim</Typography>
              <ImmutableRecordBadge label="Read-only" />
              {claim ? <ClaimStatusBadge status={claim.status} /> : null}
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Claims are assertions grounded in explicit evidence. No confidence is shown.
            </Typography>
          </Box>
          <IconButton aria-label="Close claim drawer" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Stack>

        {!claim ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            Select a claim to inspect its grounding evidence.
          </Alert>
        ) : (
          <>
            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
              Claim text
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
              {claim.text}
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
              Linked documents
            </Typography>
            {claim.documents.length === 0 ? (
              <Alert severity="error" sx={{ mt: 1 }}>
                Contract violation: claim has no linked documents (documents must be derivable from evidence).
              </Alert>
            ) : (
              <List dense aria-label="claim-documents">
                {claim.documents.map((d) => (
                  <ListItem key={d.id} disableGutters>
                    <ListItemText
                      primary={<Typography component={Link} href={`/documents/${d.id}`}>{d.title}</Typography>}
                      secondary={d.sourceLabel ?? ''}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItem>
                ))}
              </List>
            )}

            <Divider sx={{ my: 2 }} />

            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                Linked evidence
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {claim.evidence.length} evidence anchor{claim.evidence.length === 1 ? '' : 's'}
              </Typography>
            </Stack>

            <List dense aria-label="claim-evidence">
              {claim.evidence.map((ev) => (
                <ListItem
                  key={ev.id}
                  disableGutters
                  secondaryAction={
                    <Button component={Link} href={evidenceHref(ev)}>
                      Jump to evidence
                    </Button>
                  }
                >
                  <ListItemText primary={evidenceLabel(ev)} secondary={`Evidence ID: ${ev.id}`} secondaryTypographyProps={{ variant: 'caption' }} />
                </ListItem>
              ))}
            </List>
          </>
        )}
      </Box>
    </Drawer>
  );
}

