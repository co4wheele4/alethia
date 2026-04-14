import { graphql } from 'msw';

function fail(message: string): never {
  throw new Error(`[MSW guard] ${message}`);
}

/**
 * Mutation field allowlist derived from the authoritative GraphQL schema (`/src/schema.gql`).
 *
 * Note: This guard runs in both node (msw/node) and browser (msw/browser), so it must not
 * depend on filesystem access.
 */
const SCHEMA_MUTATION_FIELDS = new Set<string>([
  'adjudicateClaim',
  'assignReviewer',
  'createChunk',
  'createDocument',
  'createHtmlCrawlIngestionRun',
  'createEntity',
  'createEntityMention',
  'createEntityRelationship',
  'createEvidence',
  'createLesson',
  'createUser',
  'deleteChunk',
  'deleteDocument',
  'deleteEntity',
  'deleteEntityMention',
  'deleteEntityRelationship',
  'deleteLesson',
  'deleteUser',
  'ingestDocument',
  'importBundle',
  'linkEvidenceToClaim',
  'login',
  'register',
  'requestReview',
  'respondToReviewAssignment',
  'updateChunk',
  'updateDocument',
  'updateEntity',
  'updateEntityMention',
  'updateEntityRelationship',
  'updateLesson',
  'updateUser',
]);

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

function assertNoProbabilityRequested(query: string, operationName?: string | null) {
  if (!/\bprobability\b/i.test(query)) return;
  fail(`Forbidden field requested in GraphQL operation ${operationName ?? '(missing operationName)'}: probability`);
}

function assertNoTruthScoreRequested(query: string, operationName?: string | null) {
  if (!/\btruthScore\b/i.test(query)) return;
  fail(`Forbidden field requested in GraphQL operation ${operationName ?? '(missing operationName)'}: truthScore`);
}

/** ADR-021: No inference, semantic leakage, or graph metrics in queries */
const ADR021_FORBIDDEN_IN_QUERY = [
  'similarity',
  'relatedClaims',
  'clusters',
  'groups',
  'weights',
  'scores',
  'centrality',
  'degree',
  'ranking',
  'influence',
];

function assertNoAdr021SemanticLeakageRequested(query: string, operationName?: string | null) {
  const q = query.toLowerCase();
  for (const term of ADR021_FORBIDDEN_IN_QUERY) {
    if (new RegExp(`\\b${term}\\b`, 'i').test(q)) {
      fail(
        `ADR-021: Forbidden field requested in GraphQL operation ${operationName ?? '(missing operationName)'}: ${term}`,
      );
    }
  }
}

function deriveOperationName(query: string, operationName?: string | null): string | null {
  if (typeof operationName === 'string' && operationName.trim() !== '') return operationName;
  const m = query.match(/\b(?:query|mutation)\s+([_A-Za-z][_0-9A-Za-z]*)\b/);
  return m?.[1] ?? null;
}

function assertReviewActivityIsQueryOnly(query: string, operationName?: string | null) {
  const op = String(operationName ?? '');
  if (!/^ReviewRequestsByClaim$/i.test(op)) return;
  if (!/\bmutation\b/.test(query)) return;
  fail(`Review activity must be read-only (query-only): ${operationName ?? '(missing operationName)'}`);
}

function assertNoClaimLifecycleFieldsRequestedInReviewerCoordinationUI(
  query: string,
  operationName?: string | null,
) {
  const op = String(operationName ?? '');

  // Scope this guard to reviewer coordination surfaces only.
  // Claim detail pages legitimately query lifecycle fields; the review-queue UI must not.
  const isReviewerCoordinationOp =
    /^(ReviewQueue|MyReviewRequests|ReviewRequestsByClaim|AssignReviewer|RespondToReviewAssignment)$/i.test(op) ||
    /review-?queue/i.test(op);

  if (!isReviewerCoordinationOp) return;

  const forbidden = ['reviewedAt', 'reviewedBy', 'reviewerNote', 'ClaimLifecycleState'];
  for (const f of forbidden) {
    if (new RegExp(`\\b${f}\\b`).test(query)) {
      fail(
        `Forbidden claim lifecycle field requested in reviewer coordination operation ${operationName ?? '(missing operationName)'}: ${f}`,
      );
    }
  }
}

function extractMutationFieldName(query: string): string | null {
  const m = query.match(/\bmutation\b[\s\S]*?\{\s*([_A-Za-z][_0-9A-Za-z]*)\b/);
  return m?.[1] ?? null;
}

function assertMutationDeclaredInSchema(query: string, operationName?: string | null) {
  const isMutation = /\bmutation\b/.test(query);
  if (!isMutation) return;

  const field = extractMutationFieldName(query);
  if (!field) {
    fail(`Mutation attempted without parseable field name: ${operationName ?? '(missing operationName)'}`);
  }
  if (!SCHEMA_MUTATION_FIELDS.has(field)) {
    fail(`Mutation not declared in schema.gql attempted: ${field} (${operationName ?? '(missing operationName)'})`);
  }
}

/** ADR-022: Reject ordering, comparison, and relation-inference in queries */
function assertNoAdr022DerivedSemantics(
  query: string,
  variables: unknown,
  operationName?: string | null,
) {
  const vars = variables && typeof variables === 'object' ? (variables as Record<string, unknown>) : {};

  if (vars.orderBy !== undefined) {
    fail(`ADR-022: ORDERING_FORBIDDEN - variables.orderBy must not be used`);
  }
  if (vars.sort !== undefined) {
    fail(`ADR-022: ORDERING_FORBIDDEN - variables.sort must not be used`);
  }

  const op = String(operationName ?? '');
  if (/^Compare/i.test(op) || op === 'Compare') {
    fail(`ADR-022: COMPARISON_FORBIDDEN - operation "${op}" implies semantic comparison`);
  }

  const q = query.toLowerCase();
  if (/\brelated\b/.test(q) || /\bsimilar\b/.test(q)) {
    fail(`ADR-022: RELATION_INFERENCE_FORBIDDEN - query requests related/similar (inferred relations)`);
  }
}

/** ADR-023: no batch adjudication or non-schema lifecycle mutation names in client requests. */
function assertAdr023AdjudicationSurface(query: string, operationName?: string | null) {
  const q = query;
  if (/\badjudicateClaims\b/i.test(q) || /\bbatchAdjudicate\b/i.test(q) || /\bupdateClaim\b/i.test(q)) {
    fail(
      `ADR-023: forbidden adjudication/lifecycle mutation attempted: ${operationName ?? '(missing operationName)'}`,
    );
  }
}

/** ADR-024: no evidence mutation surface beyond create/link; no derived field names in requests. */
function assertAdr024EvidenceIngestion(query: string, operationName?: string | null) {
  if (/\bupdateEvidence\b/i.test(query)) {
    fail(`ADR-024: updateEvidence is forbidden: ${operationName ?? '(missing operationName)'}`);
  }
  const q = query.toLowerCase();
  if (/\bevidence\b/.test(q)) {
    if (/\btags\b/.test(q) || /\bclassification\b/.test(q)) {
      fail(`ADR-024: forbidden derived evidence field in ${operationName ?? '(missing operationName)'}`);
    }
  }
}

function assertNoForbiddenMutations(query: string, operationName?: string | null) {
  const isMutation = /\bmutation\b/.test(query);
  if (!isMutation) return;

  const op = String(operationName ?? '');
  const q = query;

  assertAdr023AdjudicationSurface(q, operationName);

  // ADR-005/012/013: reviewer queues are coordination-only; they must not mutate claim lifecycle or imply adjudication.
  const reviewerQueueSignals = [
    'reviewQueue',
    'reviewerQueue',
    'queueReview',
  ];
  if (
    reviewerQueueSignals.some((s) => new RegExp(`\\b${s}\\b`, 'i').test(q)) ||
    /review(?:er)?queue/i.test(op)
  ) {
    fail(`Forbidden reviewer-queue mutation attempted: ${operationName ?? '(missing operationName)'}`);
  }

  // ADR-005: lifecycle transitions must never be simulated by the frontend stub.
  // Block known lifecycle mutation surface (ADR-011) by field name and operation name.
  const field = extractMutationFieldName(q);
  if (field === 'adjudicateClaim' || /\badjudicateClaim\b/i.test(q) || /adjudicate/i.test(op) || /lifecycle/i.test(op)) {
    fail(`Forbidden claim lifecycle mutation attempted: ${operationName ?? '(missing operationName)'}`);
  }

  // Extra belt-and-suspenders: treat any "claim*-mutation" surface as lifecycle-adjacent,
  // except explicit coordination-only surfaces.
  if (field && /\bclaim\b/i.test(field) && field !== 'requestReview') {
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
      const explicitOperationName =
        typeof body?.operationName === 'string' ? body.operationName : null;
      const operationName = deriveOperationName(query, explicitOperationName);
      const variables = body?.variables;
      if (!query) continue;
      assertNoAdr022DerivedSemantics(query, variables, operationName);
      assertReviewActivityIsQueryOnly(query, operationName);
      assertNoConfidenceRequested(query, operationName);
      assertNoProbabilityRequested(query, operationName);
      assertNoTruthScoreRequested(query, operationName);
      assertNoAdr021SemanticLeakageRequested(query, operationName);
      assertNoClaimLifecycleFieldsRequestedInReviewerCoordinationUI(query, operationName);
      assertAdr024EvidenceIngestion(query, operationName);
      assertMutationDeclaredInSchema(query, operationName);
      assertNoForbiddenMutations(query, operationName);
    }

    // Fall through to operation-specific handlers.
    return;
  }),
];

