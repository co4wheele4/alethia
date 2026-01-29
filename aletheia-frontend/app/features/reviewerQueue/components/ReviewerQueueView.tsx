'use client';

import Link from 'next/link';
import { Alert, Box, Button, Chip, Divider, Stack, Typography } from '@mui/material';
import { useCallback, useMemo, useState } from 'react';

import { useAssignReviewer } from '../hooks/useAssignReviewer';
import type { ReviewAssignment, ReviewRequest, ReviewRequestSource } from '../types';

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

function formatRequestedBy(rr: ReviewRequest) {
  const email = rr.requestedBy?.email ?? '';
  const name = rr.requestedBy?.name ?? '';
  if (name && email) return `${name} (${email})`;
  return email || name || rr.requestedBy?.id || '(unknown user)';
}

function assignmentLabelForUserId(args: {
  assignment: ReviewAssignment;
  currentUserId: string | null;
}): string {
  if (args.currentUserId && args.assignment.reviewerUserId === args.currentUserId) return 'you';
  return args.assignment.reviewerUserId;
}

function assignReviewerErrorMessage(code: string) {
  switch (code) {
    case 'UNAUTHORIZED':
      return 'You are not authorized to assign reviewers.';
    case 'REVIEW_REQUEST_NOT_FOUND':
      return 'This review request no longer exists or is unavailable.';
    case 'REVIEWER_NOT_ELIGIBLE':
      return 'That reviewer cannot see this review request in their workspace.';
    case 'DUPLICATE_ASSIGNMENT':
      return 'That reviewer is already assigned (coordination only).';
    case 'UNEXPECTED_ERROR_CODE':
      return 'Unexpected assignment error code (contract mismatch).';
    case 'NETWORK_OR_UNKNOWN':
      return 'Unexpected assignment error (network/unknown).';
    default:
      return 'Unexpected assignment error (unknown).';
  }
}

function groupBySource(items: ReviewRequest[]) {
  const by: Record<ReviewRequestSource, ReviewRequest[]> = {
    CLAIM_VIEW: [],
    COMPARISON: [],
  };
  for (const rr of items) {
    if (rr.source === 'CLAIM_VIEW' || rr.source === 'COMPARISON') by[rr.source].push(rr);
  }
  return by;
}

export function ReviewerQueueView(props: {
  items: ReviewRequest[];
  currentUserId: string | null;
  currentUserRole: string | null;
  onRefetch: () => Promise<unknown>;
}) {
  const { items, currentUserId, currentUserRole, onRefetch } = props;
  const grouped = groupBySource(items);
  const isAdmin = currentUserRole === 'ADMIN';
  const [pendingAssignFor, setPendingAssignFor] = useState<string | null>(null);

  const { assignReviewer, loading: assigning, error: assignError } = useAssignReviewer();

  const assignedToYou = useMemo(() => {
    if (!currentUserId) return [];
    return items.filter((rr) =>
      (rr.reviewAssignments ?? []).some((a) => a.reviewerUserId === currentUserId),
    );
  }, [currentUserId, items]);

  const requestSelfAssignment = useCallback(
    async (reviewRequestId: string) => {
      if (!currentUserId) return;
      setPendingAssignFor(reviewRequestId);
      try {
        await assignReviewer({ reviewRequestId, reviewerUserId: currentUserId });
        await onRefetch();
      } finally {
        setPendingAssignFor(null);
      }
    },
    [assignReviewer, currentUserId, onRefetch],
  );

  return (
    <Stack spacing={2}>
      <Alert severity="info">
        Review requests coordinate attention. They do not change truth or claim status.
      </Alert>
      <Alert severity="info">
        Assignment coordinates attention. It does not change truth or claim status.
      </Alert>

      <Box>
        <Typography variant="h6">Pending review</Typography>
        <Typography variant="body2" color="text.secondary">
          This queue is read-only. Requests are not assignments and do not imply conflict, correctness, or adjudication.
        </Typography>
      </Box>

      <Divider />

      {assignedToYou.length ? (
        <Stack spacing={1.25} aria-label="Assigned to you">
          <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
            Assigned to you
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Assigned items coordinate attention only. This does not imply obligation, authority, or adjudication.
          </Typography>
          {assignedToYou.map((rr) => (
            <Box
              key={`assigned-${rr.id}`}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                p: 1.5,
                bgcolor: 'background.paper',
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, minWidth: 0 }}>
                  Assigned (coordination only)
                </Typography>
                <Chip size="small" color="info" variant="outlined" label="Assigned (coordination only)" />
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Source: {sourceLabel(rr.source)}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Requested by: {formatRequestedBy(rr)}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Assigned reviewers: {(rr.reviewAssignments ?? []).map((a) => assignmentLabelForUserId({ assignment: a, currentUserId })).join(', ')}
              </Typography>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1.25 }}>
                <Button
                  component={Link}
                  href={`/claims/${encodeURIComponent(rr.claimId)}`}
                  size="small"
                  sx={{ textTransform: 'none' }}
                >
                  View claim
                </Button>
              </Stack>
            </Box>
          ))}
          <Divider />
        </Stack>
      ) : null}

      {assignError ? (
        <Alert severity="error">
          {(() => {
            const code =
              typeof (assignError as { code?: unknown })?.code === 'string'
                ? String((assignError as { code?: unknown }).code)
                : '';
            const msg = assignReviewerErrorMessage(code);
            return code ? `${msg} [${code}]` : msg;
          })()}
        </Alert>
      ) : null}

      {items.length === 0 ? (
        <Alert severity="warning">No pending review requests.</Alert>
      ) : (
        <Stack spacing={2} aria-label="Pending review queue">
          {(Object.keys(grouped) as ReviewRequestSource[]).map((source) =>
            grouped[source].length ? (
              <Stack key={source} spacing={1.25}>
                <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                  {sourceLabel(source)}
                </Typography>

                {grouped[source].map((rr) => (
                  <Box
                    key={rr.id}
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      p: 1.5,
                      bgcolor: 'background.paper',
                    }}
                  >
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{ mb: 0.5 }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, minWidth: 0 }}>
                        Pending review
                      </Typography>
                      {(rr.reviewAssignments ?? []).length ? (
                        <Chip size="small" color="info" variant="outlined" label="Assigned (coordination only)" />
                      ) : (
                        <Chip size="small" color="warning" variant="outlined" label="Review Requested (Not Assigned)" />
                      )}
                    </Stack>

                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Source: {sourceLabel(rr.source)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Requested by: {formatRequestedBy(rr)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Requested at: {new Date(rr.requestedAt).toISOString()}
                    </Typography>

                    {(rr.reviewAssignments ?? []).length ? (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        Assigned (coordination only):{' '}
                        {(rr.reviewAssignments ?? [])
                          .map((a) => assignmentLabelForUserId({ assignment: a, currentUserId }))
                          .join(', ')}
                      </Typography>
                    ) : null}

                    {rr.note ? (
                      <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
                        Note: {rr.note}
                      </Typography>
                    ) : null}

                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1.25 }}>
                      <Button
                        component={Link}
                        href={`/claims/${encodeURIComponent(rr.claimId)}`}
                        size="small"
                        sx={{ textTransform: 'none' }}
                      >
                        View claim
                      </Button>
                      {isAdmin && currentUserId ? (
                        <Button
                          size="small"
                          sx={{ textTransform: 'none' }}
                          disabled={
                            assigning ||
                            pendingAssignFor === rr.id ||
                            (rr.reviewAssignments ?? []).some((a) => a.reviewerUserId === currentUserId)
                          }
                          onClick={() => requestSelfAssignment(rr.id)}
                        >
                          {pendingAssignFor === rr.id ? 'Assigning…' : 'Assign to me (coordination only)'}
                        </Button>
                      ) : null}
                    </Stack>
                  </Box>
                ))}
              </Stack>
            ) : null,
          )}
        </Stack>
      )}
    </Stack>
  );
}

