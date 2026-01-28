import { graphql } from 'msw';

function fail(message: string): never {
  throw new Error(`[MSW guard] ${message}`);
}

type GraphQLBody = {
  operationName?: string | null;
  query?: string | null;
  variables?: unknown;
};

async function readBody(request: Request): Promise<GraphQLBody[] | null> {
  try {
    const json = (await request.json()) as unknown;
    if (Array.isArray(json)) return json as GraphQLBody[];
    if (json && typeof json === 'object') return [json as GraphQLBody];
    return null;
  } catch {
    return null;
  }
}

function assertNoConfidenceRequested(query: string, operationName?: string | null) {
  if (!/\bconfidence\b/i.test(query)) return;
  fail(`Forbidden field requested in GraphQL operation ${operationName ?? '(missing operationName)'}: confidence`);
}

function assertNoForbiddenMutations(query: string, operationName?: string | null) {
  const isMutation = /\bmutation\b/.test(query);
  if (!isMutation) return;

  const op = String(operationName ?? '');
  const q = query;

  // ADR-005/012/013: reviewer queues are coordination-only; no mutations are allowed for them.
  const reviewerQueueSignals = [
    'reviewQueue',
    'reviewerQueue',
    'queueReview',
    'requestReview', // if someone tries to back it with a mutation, we must fail
  ];
  if (
    reviewerQueueSignals.some((s) => new RegExp(`\\b${s}\\b`, 'i').test(q)) ||
    /review(?:er)?queue/i.test(op)
  ) {
    fail(`Forbidden reviewer-queue mutation attempted: ${operationName ?? '(missing operationName)'}`);
  }

  // ADR-005: lifecycle transitions must never be simulated by the frontend stub.
  // Block known lifecycle mutation surface (ADR-011) by field name and operation name.
  if (/\badjudicateClaim\b/i.test(q) || /adjudicate/i.test(op) || /lifecycle/i.test(op)) {
    fail(`Forbidden claim lifecycle mutation attempted: ${operationName ?? '(missing operationName)'}`);
  }
}

/**
 * Guard handlers that fail tests/dev if forbidden GraphQL operations are attempted.
 *
 * This does NOT imply backend support; it exists to enforce epistemic constraints:
 * - No reviewer queue mutations
 * - No lifecycle mutations (claim status transitions)
 * - No confidence fields requested
 */
export const guardHandlers = [
  graphql.operation(async ({ request }) => {
    const bodies = await readBody(request);
    if (!bodies) return;

    for (const body of bodies) {
      const query = typeof body?.query === 'string' ? body.query : '';
      const operationName = typeof body?.operationName === 'string' ? body.operationName : null;
      if (!query) continue;
      assertNoConfidenceRequested(query, operationName);
      assertNoForbiddenMutations(query, operationName);
    }

    // Fall through to operation-specific handlers.
    return;
  }),
];

