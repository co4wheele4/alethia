'use client';

import { Alert, Box, Chip, Divider, Stack, Typography } from '@mui/material';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import { useMemo } from 'react';

import { ContentSurface } from '../../../components/layout';
import { useReviewActivityForClaim } from '../hooks/useReviewActivityForClaim';

import type { ReviewRequestSource, ReviewerResponseType } from '../../reviewerQueue/types';

// Apollo may return masked/partial objects at the type level; treat review activity UI as a
// defensive, read-only renderer and do not assume fields beyond what we display.
type ReviewActivityRequest = {
  id?: string;
  requestedAt?: string;
  source?: ReviewRequestSource;
  note?: string | null;
  requestedBy?: { id?: string; email?: string; name?: string | null } | null;
  reviewAssignments?: Array<{
    id?: string;
    reviewerUserId?: string;
    assignedAt?: string;
    reviewerResponse?: { response?: ReviewerResponseType; respondedAt?: string; note?: string | null } | null;
  }> | null;
};

const DISCLAIMER = `Review activity records coordination only.
It does not determine truth, correctness, or claim status.`;

function sourceLabel(source: ReviewRequestSource) {
  switch (source) {
    case 'COMPARISON':
      return 'Comparison';
    case 'CLAIM_VIEW':
      return 'Claim view';
    default:
      return source;
  }
}

function responseLabel(response: ReviewerResponseType) {
  switch (response) {
    case 'ACKNOWLEDGED':
      return 'ACKNOWLEDGED';
    case 'DECLINED':
      return 'DECLINED';
    default:
      return response;
  }
}

function formatIso(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toISOString();
}

function requestedByLabel(rr: ReviewActivityRequest) {
  const name = rr.requestedBy?.name ?? '';
  const email = rr.requestedBy?.email ?? '';
  if (name && email) return `${name} (${email})`;
  return email || name || rr.requestedBy?.id || '(unknown user)';
}

function renderAssignmentSummary(a: NonNullable<ReviewActivityRequest['reviewAssignments']>[number]) {
  const resp = a.reviewerResponse ?? null;
  return {
    reviewerUserId: a.reviewerUserId ?? '(missing reviewerUserId)',
    assignedAt: a.assignedAt ?? '',
    response: resp?.response ?? null,
    respondedAt: resp?.respondedAt ?? null,
  };
}

function countBySource(items: ReviewActivityRequest[]) {
  const out: Record<ReviewRequestSource, number> = { CLAIM_VIEW: 0, COMPARISON: 0 };
  for (const rr of items) {
    if (rr.source === 'CLAIM_VIEW' || rr.source === 'COMPARISON') out[rr.source] += 1;
  }
  return out;
}

export function ReviewActivityPanel(props: { claimId: string; defaultExpanded?: boolean; testId?: string }) {
  const { claimId, defaultExpanded = false, testId = 'review-activity-panel' } = props;
  const { items, loading, error } = useReviewActivityForClaim(claimId);
  const safeItems = items as unknown as ReviewActivityRequest[];

  const bySource = useMemo(() => countBySource(safeItems), [safeItems]);

  return (
    <ContentSurface>
      <Accordion defaultExpanded={defaultExpanded} disableGutters elevation={0} sx={{ bgcolor: 'transparent' }}>
        <AccordionSummary>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap', minWidth: 0 }} data-testid={testId}>
            <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
              Review Activity
            </Typography>
            <Chip
              size="small"
              variant="outlined"
              label={`${safeItems.length} request${safeItems.length === 1 ? '' : 's'}`}
              data-testid="review-activity-request-count"
            />
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={1.25}>
            <Alert severity="info" data-testid="review-activity-disclaimer">
              {DISCLAIMER.split('\n').map((line) => (
                <Box key={line} component="div">
                  {line}
                </Box>
              ))}
            </Alert>

            {loading ? (
              <Typography variant="body2" color="text.secondary">
                Loading review activity…
              </Typography>
            ) : null}

            {error ? (
              <Alert severity="error">Unable to load review activity: {error.message}</Alert>
            ) : null}

            {!loading && !error ? (
              <>
                <Typography variant="caption" color="text.secondary" data-testid="review-activity-sources">
                  Sources: Claim view ({bySource.CLAIM_VIEW}), Comparison ({bySource.COMPARISON})
                </Typography>

                <Divider />

                {safeItems.length === 0 ? (
                  <Alert severity="warning">No review activity recorded for this claim.</Alert>
                ) : (
                  <Stack spacing={1.5}>
                    {safeItems.map((rr, idx) => {
                      const assignments = (rr.reviewAssignments ?? []).map(renderAssignmentSummary);
                      return (
                        <Box
                          key={rr.id ?? `rr-${idx}`}
                          sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5 }}
                          data-testid={`review-activity-request-${rr.id ?? `idx-${idx}`}`}
                        >
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap' }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                              Review request
                            </Typography>
                            <Chip size="small" variant="outlined" label={sourceLabel(rr.source ?? 'CLAIM_VIEW')} />
                          </Stack>

                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                            Requested at: {rr.requestedAt ? formatIso(rr.requestedAt) : '(missing requestedAt)'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            Requested by: {requestedByLabel(rr)}
                          </Typography>

                          {rr.note ? (
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mt: 0.75 }}>
                              Note: {rr.note}
                            </Typography>
                          ) : null}

                          <Divider sx={{ my: 1.25 }} />

                          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                            Assigned reviewers
                          </Typography>

                          {assignments.length === 0 ? (
                            <Typography variant="body2" color="text.secondary">
                              None recorded.
                            </Typography>
                          ) : (
                            <Stack spacing={0.75} sx={{ mt: 0.5 }}>
                              {assignments.map((a) => (
                                <Box key={`${rr.id}:${a.reviewerUserId}:${a.assignedAt}`}>
                                  <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap' }}>
                                    <Chip size="small" variant="outlined" label={`reviewerUserId: ${a.reviewerUserId}`} />
                                    <Typography variant="caption" color="text.secondary">
                                      Assigned at: {formatIso(a.assignedAt)}
                                    </Typography>
                                    {a.response ? (
                                      <Chip
                                        size="small"
                                        color={a.response === 'DECLINED' ? 'warning' : 'success'}
                                        variant="outlined"
                                        label={responseLabel(a.response)}
                                      />
                                    ) : null}
                                  </Stack>
                                  {a.respondedAt ? (
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                                      Responded at: {formatIso(a.respondedAt)}
                                    </Typography>
                                  ) : null}
                                </Box>
                              ))}
                            </Stack>
                          )}
                        </Box>
                      );
                    })}
                  </Stack>
                )}
              </>
            ) : null}
          </Stack>
        </AccordionDetails>
      </Accordion>
    </ContentSurface>
  );
}

