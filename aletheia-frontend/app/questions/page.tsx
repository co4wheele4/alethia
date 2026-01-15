/**
 * Question Workspace (Gated)
 *
 * Constraints:
 * - No chat UI metaphors
 * - No answers without evidence linkage
 * - Users must view documents and explicitly select sources before asking
 */
'use client';

import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Checkbox,
  Divider,
  FormControlLabel,
  LinearProgress,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  TextField,
  Typography,
} from '@mui/material';

import { AppShell } from '../components/shell';
import { useAuth } from '../hooks/useAuth';
import { getUserIdFromToken } from '../lib/utils/jwt';
import { useDocuments } from '../features/documents/hooks/useDocuments';
import { useEntities } from '../features/entities/hooks/useEntities';

function useHasViewedDocumentsGate() {
  const [hasViewed, setHasViewed] = useState(false);
  useEffect(() => {
    try {
      setHasViewed(globalThis.localStorage?.getItem('aletheia.hasViewedDocuments.v1') === 'true');
    } catch {
      setHasViewed(false);
    }
  }, []);
  return hasViewed;
}

export default function QuestionsPage() {
  const { token } = useAuth();
  const userId = getUserIdFromToken(token);

  const hasViewedDocuments = useHasViewedDocumentsGate();
  const docs = useDocuments(userId);
  const entities = useEntities();

  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [timeStartIso, setTimeStartIso] = useState('');
  const [timeEndIso, setTimeEndIso] = useState('');
  const [entityConstraintIds, setEntityConstraintIds] = useState<string[]>([]);
  const [question, setQuestion] = useState('');

  const canAskByUx = hasViewedDocuments && selectedDocumentIds.length > 0;

  return (
    <AppShell title="Questions">
      {!userId ? (
        <Alert severity="info">Question workspace is available after login.</Alert>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Alert severity="info">
            Questions are allowed only after you’ve inspected documents and explicitly selected sources. Answers must be
            structured claims linked to evidence.
          </Alert>

          {!hasViewedDocuments ? (
            <Alert severity="warning">
              Gate: you have not viewed documents yet. Open <strong>Documents</strong> first.
            </Alert>
          ) : null}

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '420px 1fr' }, gap: 2 }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h6" gutterBottom>
                Scope (explicit)
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Select the documents that are in scope. Nothing is implicitly included.
              </Typography>

              {docs.loading ? (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Loading documents for scope selection…
                  </Typography>
                  <LinearProgress />
                </Box>
              ) : null}

              {docs.error ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {docs.error.message}
                </Alert>
              ) : null}

              {!docs.loading && docs.documents.length === 0 ? (
                <Alert severity="info">No documents available. Ingest sources first to build an evidence base.</Alert>
              ) : null}

              <List dense aria-label="question-scope-documents">
                {docs.documents
                  .slice()
                  .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                  .map((d) => {
                    const checked = selectedDocumentIds.includes(d.id);
                    return (
                      <ListItemButton
                        key={d.id}
                        sx={{ borderRadius: 1 }}
                        onClick={() =>
                          setSelectedDocumentIds((prev) =>
                            prev.includes(d.id) ? prev.filter((x) => x !== d.id) : [...prev, d.id]
                          )
                        }
                      >
                        <ListItemIcon>
                          <Checkbox edge="start" checked={checked} tabIndex={-1} disableRipple />
                        </ListItemIcon>
                        <ListItemText
                          primary={d.title}
                          secondary={`Date added: ${new Date(d.createdAt).toLocaleString()}`}
                          secondaryTypographyProps={{ variant: 'caption' }}
                        />
                      </ListItemButton>
                    );
                  })}
              </List>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" gutterBottom>
                Optional time bounds
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                ISO-8601 strings. If omitted, no time constraint is applied.
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 2 }}>
                <TextField
                  label="Start (ISO)"
                  value={timeStartIso}
                  onChange={(e) => setTimeStartIso(e.target.value)}
                  size="small"
                  placeholder="e.g. 2025-01-01T00:00:00Z"
                />
                <TextField
                  label="End (ISO)"
                  value={timeEndIso}
                  onChange={(e) => setTimeEndIso(e.target.value)}
                  size="small"
                  placeholder="e.g. 2026-01-01T00:00:00Z"
                />
              </Box>

              <Typography variant="subtitle2" gutterBottom>
                Optional entity constraints
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Entity constraints are explicit. If none are selected, all entities are allowed within the document
                scope.
              </Typography>

              {entities.loading ? (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Loading entities for constraint selection…
                  </Typography>
                  <LinearProgress />
                </Box>
              ) : null}

              {entities.error ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {entities.error.message}
                </Alert>
              ) : null}

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {entities.entities.slice(0, 25).map((e) => {
                  const checked = entityConstraintIds.includes(e.id);
                  return (
                    <FormControlLabel
                      key={e.id}
                      control={
                        <Checkbox
                          checked={checked}
                          onChange={() =>
                            setEntityConstraintIds((prev) =>
                              prev.includes(e.id) ? prev.filter((x) => x !== e.id) : [...prev, e.id]
                            )
                          }
                        />
                      }
                      label={`${e.name} (${e.type || 'unknown'})`}
                    />
                  );
                })}
                {entities.entities.length > 25 ? (
                  <Typography variant="caption" color="text.secondary">
                    Showing first 25 entities. (A dedicated constraint picker is pending.)
                  </Typography>
                ) : null}
              </Box>

              {/* Explicit scope variables stay visible above; nothing is sent implicitly. */}
            </Box>

            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h6" gutterBottom>
                Question (structured input)
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Phrase a question or hypothesis. The system must respond with evidence-linked claims, not conversation.
              </Typography>

              <TextField
                label="Question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                minRows={4}
                multiline
                fullWidth
                placeholder="Example: Which documents mention Entity X between dates Y and Z? Provide claims with citations."
                sx={{ mb: 2 }}
                disabled={!hasViewedDocuments}
              />

              {!canAskByUx ? (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Gate: you must (1) view documents and (2) select at least one source document before asking.
                </Alert>
              ) : null}

              <Alert severity="warning">
                Asking is currently disabled: the backend API does not return answers as structured claims with direct
                chunk citations. Until it does, the UI will not present “answers” that cannot be audited.
              </Alert>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                Answers (claims with sources)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pending: requires GraphQL response shape with claims → supporting chunks → source documents and
                per-source confidence. Default behavior is “show more evidence”.
              </Typography>
            </Box>
          </Box>
        </Box>
      )}
    </AppShell>
  );
}

