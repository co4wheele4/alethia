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

const requestedBy = {
  __typename: 'User' as const,
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
};

let store: ReviewRequest[] = [];

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
    };

    rr.reviewAssignments = [created, ...rr.reviewAssignments];

    const data = { assignReviewer: created };
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

