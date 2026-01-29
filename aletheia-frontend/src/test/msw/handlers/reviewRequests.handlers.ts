import { graphql, HttpResponse } from 'msw';

import { assertNoConfidence } from '@/src/test/msw/assertNoConfidence';

type ReviewRequestSource = 'CLAIM_VIEW' | 'COMPARISON';

type ReviewAssignment = {
  __typename: 'ReviewAssignment';
  id: string;
  reviewRequestId: string;
  reviewerUserId: string;
  assignedByUserId: string;
  assignedAt: string;
  reviewerResponse?: ReviewerResponse | null;
};

type ReviewerResponseType = 'ACKNOWLEDGED' | 'DECLINED';

type ReviewerResponse = {
  __typename: 'ReviewerResponse';
  id: string;
  reviewAssignmentId: string;
  reviewerUserId: string;
  response: ReviewerResponseType;
  respondedAt: string;
  note: string | null;
};

type ReviewRequest = {
  __typename: 'ReviewRequest';
  id: string;
  claimId: string;
  requestedAt: string;
  source: ReviewRequestSource;
  note: string | null;
  requestedBy: { __typename: 'User'; id: string; email: string; name: string | null };
  reviewAssignments: ReviewAssignment[];
};

function base64UrlDecode(input: string): string {
  // Works in both Node (vitest) and the browser (MSW service worker runtime).
  const padded = input.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(input.length / 4) * 4, '=');
  if (typeof Buffer !== 'undefined') return Buffer.from(padded, 'base64').toString('utf8');
  return decodeURIComponent(escape(atob(padded)));
}

function parseJwtSub(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const payload = JSON.parse(base64UrlDecode(parts[1] ?? '')) as unknown;
    const sub = (payload as { sub?: unknown })?.sub;
    return typeof sub === 'string' ? sub : null;
  } catch {
    return null;
  }
}

const requestedBy = {
  __typename: 'User' as const,
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
};

let store: ReviewRequest[] = [];
let reviewerResponseSeq = 0;

export const reviewRequestHandlers = [
  graphql.query('ReviewQueue', () => {
    const data = { reviewQueue: store };
    assertNoConfidence(data, 'data');
    return HttpResponse.json({ data });
  }),

  graphql.query('MyReviewRequests', () => {
    const data = { myReviewRequests: store.filter((rr) => rr.requestedBy.id === requestedBy.id) };
    assertNoConfidence(data, 'data');
    return HttpResponse.json({ data });
  }),

  graphql.query('ReviewRequestsByClaim', ({ variables }) => {
    const v = (variables ?? {}) as { claimId?: string };
    const claimId = v.claimId ?? '';
    const data = { reviewRequestsByClaim: store.filter((rr) => rr.claimId === claimId) };
    assertNoConfidence(data, 'data');
    return HttpResponse.json({ data });
  }),

  graphql.mutation('AssignReviewer', ({ variables, request }) => {
    // MSW contract enforcement (not a security boundary).
    const auth = request.headers.get('authorization');
    if (!auth) {
      return HttpResponse.json({ errors: [{ message: 'UNAUTHORIZED', extensions: { code: 'UNAUTHORIZED' } }] });
    }

    const v = (variables ?? {}) as { reviewRequestId?: string; reviewerUserId?: string };
    const reviewRequestId = v.reviewRequestId ?? '';
    const reviewerUserId = v.reviewerUserId ?? '';

    const rr = store.find((x) => x.id === reviewRequestId) ?? null;
    if (!rr) {
      return HttpResponse.json({
        errors: [{ message: 'REVIEW_REQUEST_NOT_FOUND', extensions: { code: 'REVIEW_REQUEST_NOT_FOUND' } }],
      });
    }

    // Reviewer eligibility (minimal for MSW): ensure a non-empty reviewerUserId.
    if (!reviewerUserId) {
      return HttpResponse.json({
        errors: [{ message: 'REVIEWER_NOT_ELIGIBLE', extensions: { code: 'REVIEWER_NOT_ELIGIBLE' } }],
      });
    }

    if (rr.reviewAssignments.some((a) => a.reviewerUserId === reviewerUserId)) {
      return HttpResponse.json({
        errors: [{ message: 'DUPLICATE_ASSIGNMENT', extensions: { code: 'DUPLICATE_ASSIGNMENT' } }],
      });
    }

    const created: ReviewAssignment = {
      __typename: 'ReviewAssignment',
      id: `ra_${rr.reviewAssignments.length + 1}`,
      reviewRequestId: rr.id,
      reviewerUserId,
      // In MSW tests this is coordination metadata only; use the known fixture user id.
      assignedByUserId: requestedBy.id,
      assignedAt: new Date('2026-01-21T12:00:00.000Z').toISOString(),
      reviewerResponse: null,
    };

    rr.reviewAssignments = [created, ...rr.reviewAssignments];

    const data = { assignReviewer: created };
    assertNoConfidence(data, 'data');
    return HttpResponse.json({ data });
  }),

  graphql.mutation('RespondToReviewAssignment', ({ variables, request }) => {
    // MSW contract enforcement (not a security boundary).
    const auth = request.headers.get('authorization');
    if (!auth) {
      return HttpResponse.json({ errors: [{ message: 'UNAUTHORIZED', extensions: { code: 'UNAUTHORIZED' } }] });
    }

    const userId = parseJwtSub(auth);
    if (!userId) {
      return HttpResponse.json({ errors: [{ message: 'UNAUTHORIZED', extensions: { code: 'UNAUTHORIZED' } }] });
    }

    const v = (variables ?? {}) as {
      reviewAssignmentId?: string;
      response?: ReviewerResponseType;
      note?: string | null;
    };
    const reviewAssignmentId = v.reviewAssignmentId ?? '';
    const response = v.response ?? null;
    const note = v.note ?? null;

    if (!reviewAssignmentId || (response !== 'ACKNOWLEDGED' && response !== 'DECLINED')) {
      return HttpResponse.json({ errors: [{ message: 'BAD_USER_INPUT', extensions: { code: 'BAD_USER_INPUT' } }] });
    }

    const assignments = store.flatMap((rr) => rr.reviewAssignments ?? []);
    const assignment = assignments.find((a) => a.id === reviewAssignmentId) ?? null;
    if (!assignment) {
      return HttpResponse.json({
        errors: [{ message: 'ASSIGNMENT_NOT_FOUND', extensions: { code: 'ASSIGNMENT_NOT_FOUND' } }],
      });
    }

    if (assignment.reviewerUserId !== userId) {
      return HttpResponse.json({
        errors: [{ message: 'NOT_ASSIGNED_REVIEWER', extensions: { code: 'NOT_ASSIGNED_REVIEWER' } }],
      });
    }

    if (assignment.reviewerResponse) {
      return HttpResponse.json({
        errors: [{ message: 'DUPLICATE_RESPONSE', extensions: { code: 'DUPLICATE_RESPONSE' } }],
      });
    }

    const created: ReviewerResponse = {
      __typename: 'ReviewerResponse',
      id: `resp_${(reviewerResponseSeq += 1)}`,
      reviewAssignmentId: assignment.id,
      reviewerUserId: userId,
      response,
      respondedAt: new Date('2026-01-21T12:30:00.000Z').toISOString(),
      note,
    };

    assignment.reviewerResponse = created;

    const data = { respondToReviewAssignment: created };
    assertNoConfidence(data, 'data');
    return HttpResponse.json({ data });
  }),

  graphql.mutation('RequestReview', ({ variables }) => {
    const v = (variables ?? {}) as { claimId?: string; source?: ReviewRequestSource; note?: string | null };
    const claimId = v.claimId ?? '';
    const source = v.source ?? null;
    const note = v.note ?? null;

    if (!claimId || (source !== 'CLAIM_VIEW' && source !== 'COMPARISON')) {
      return HttpResponse.json({ errors: [{ message: 'BAD_USER_INPUT', extensions: { code: 'BAD_USER_INPUT' } }] });
    }

    const dup = store.some((rr) => rr.claimId === claimId && rr.requestedBy.id === requestedBy.id);
    if (dup) {
      return HttpResponse.json({
        errors: [{ message: 'DUPLICATE_REVIEW_REQUEST', extensions: { code: 'DUPLICATE_REVIEW_REQUEST' } }],
      });
    }

    const created: ReviewRequest = {
      __typename: 'ReviewRequest',
      id: `rr_${store.length + 1}`,
      claimId,
      requestedAt: new Date('2026-01-21T12:00:00.000Z').toISOString(),
      source,
      note,
      requestedBy,
      reviewAssignments: [],
    };
    store = [created, ...store];

    const data = { requestReview: created };
    assertNoConfidence(data, 'data');
    return HttpResponse.json({ data });
  }),
];

