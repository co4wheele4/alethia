import { graphql, HttpResponse } from 'msw';

import { assertNoConfidence } from '@/src/test/msw/assertNoConfidence';

type ReviewRequestSource = 'CLAIM_VIEW' | 'COMPARISON';

type ReviewRequest = {
  __typename: 'ReviewRequest';
  id: string;
  claimId: string;
  requestedAt: string;
  source: ReviewRequestSource;
  note: string | null;
  requestedBy: { __typename: 'User'; id: string; email: string; name: string | null };
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
    };
    store = [created, ...store];

    const data = { requestReview: created };
    assertNoConfidence(data, 'data');
    return HttpResponse.json({ data });
  }),
];

