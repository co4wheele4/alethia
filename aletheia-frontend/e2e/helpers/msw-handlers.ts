/**
 * MSW Handlers for Playwright E2E Tests
 * 
 * This file provides Playwright route handlers that mimic MSW handlers
 * for GraphQL API mocking in E2E tests.
 * 
 * Playwright uses route interception instead of service workers,
 * so we convert MSW-style handlers to Playwright route handlers.
 */

import { Route } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

function base64UrlEncode(input: string): string {
  // Node supports base64url in recent versions, but keep it explicit for portability
  return Buffer.from(input).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64UrlDecode(input: string): string {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(input.length / 4) * 4, '=');
  return Buffer.from(padded, 'base64').toString('utf8');
}

function parseJwt(token: string): Record<string, unknown> | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    return JSON.parse(base64UrlDecode(parts[1])) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function varString(vars: Record<string, unknown> | undefined, key: string): string | undefined {
  const v = vars?.[key];
  if (typeof v === 'string') return v;
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  return undefined;
}

function varNumber(vars: Record<string, unknown> | undefined, key: string): number | undefined {
  const v = vars?.[key];
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) return Number(v);
  return undefined;
}

function createMockJwt(payload: Record<string, unknown>): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  // Signature is irrelevant for client-side decoding in tests
  return `${encodedHeader}.${encodedPayload}.signature`;
}

let documentsStore: Array<{ id: string; title: string; createdAt: string }> = [];
let chunksStore: Record<
  string,
  Array<{ id: string; chunkIndex: number; content: string }>
> = {};

let entitiesStore: Array<{ id: string; name: string; type: string; mentionCount: number }> = [];
let entityDetailStore: Record<string, Record<string, unknown> | null> = {};
let mentionsStore: Array<Record<string, unknown>> = [];
let relationshipsStore: Array<Record<string, unknown>> = [];
let claimsStore: Array<Record<string, unknown>> = [];
let reviewRequestsStore: Array<Record<string, unknown>> = [];
let reviewAssignmentsStore: Array<Record<string, unknown>> = [];
let reviewerResponsesSeq = 0;

function ensureSeeded() {
  if (documentsStore.length > 0) return;

  const createdAt = new Date('2026-01-01T00:00:00Z').toISOString();
  const sourceId = 'source-doc-1';

  documentsStore = [{ id: 'doc-1', title: 'Getting Started', createdAt }];
  chunksStore = {
    'doc-1': [
      {
        id: 'chunk-doc-1-0',
        chunkIndex: 0,
        content: [
          '---',
          'source:',
          '  kind: url',
          '  url: "https://example.com/getting-started"',
          'provenanceType: ',
          'provenanceLabel: ',
          'provenanceConfirmed: ',
          `ingestedAt: "${createdAt}"`,
          'contentSha256: 0000000000000000000000000000000000000000000000000000000000000000',
          '---',
          'Getting Started (chunk 0)',
        ].join('\n'),
      },
      { id: 'chunk-doc-1-1', chunkIndex: 1, content: 'This chunk mentions Test Entity.' },
    ],
  };

  entitiesStore = [
    { id: 'entity-1', name: 'Test Entity', type: 'TestType', mentionCount: 1 },
    { id: 'entity-2', name: 'Other Entity', type: 'TestType', mentionCount: 0 },
  ];

  mentionsStore = [
    {
      __typename: 'EntityMention',
      id: 'mention-1',
      entityId: 'entity-1',
      chunkId: 'chunk-doc-1-1',
      startOffset: 20,
      endOffset: 31,
      excerpt: 'Test Entity',
      entity: { __typename: 'Entity', id: 'entity-1', name: 'Test Entity', type: 'TestType', mentionCount: 1 },
    },
  ];

  relationshipsStore = [
    {
      __typename: 'EntityRelationship',
      id: 'rel-1',
      relation: 'MENTIONS',
      from: { __typename: 'Entity', id: 'entity-1', name: 'Test Entity', type: 'TestType', mentionCount: 1 },
      to: { __typename: 'Entity', id: 'entity-2', name: 'Other Entity', type: 'TestType', mentionCount: 0 },
      evidence: [
        {
          __typename: 'EntityRelationshipEvidence',
          id: 'ev-1',
          kind: 'TEXT_SPAN',
          createdAt,
          chunkId: 'chunk-doc-1-1',
          startOffset: 20,
          endOffset: 31,
          quotedText: 'Test Entity',
          chunk: {
            __typename: 'DocumentChunk',
            id: 'chunk-doc-1-1',
            chunkIndex: 1,
            content: 'This chunk mentions Test Entity.',
            documentId: 'doc-1',
            document: {
              __typename: 'Document',
              id: 'doc-1',
              title: 'Getting Started',
              createdAt,
              sourceType: 'URL',
              sourceLabel: 'example.com',
              source: {
                __typename: 'DocumentSource',
                id: sourceId,
                documentId: 'doc-1',
                kind: 'URL',
                ingestedAt: createdAt,
                accessedAt: createdAt,
                publishedAt: null,
                author: null,
                publisher: null,
                filename: null,
                mimeType: null,
                contentType: null,
                sizeBytes: null,
                requestedUrl: 'https://example.com/getting-started',
                fetchedUrl: 'https://example.com/getting-started',
                contentSha256: null,
                fileSha256: null,
                lastModifiedMs: null,
              },
            },
          },
          mentionLinks: [
            {
              __typename: 'EntityRelationshipEvidenceMention',
              evidenceId: 'ev-1',
              mentionId: 'mention-1',
              mention: mentionsStore[0],
            },
          ],
        },
      ],
    },
  ];

  entityDetailStore = {
    'entity-1': {
      __typename: 'Entity',
      id: 'entity-1',
      name: 'Test Entity',
      type: 'TestType',
      mentionCount: 1,
      outgoing: [relationshipsStore[0]],
      incoming: [],
      mentions: [
        {
          ...mentionsStore[0],
          chunk: {
            __typename: 'DocumentChunk',
            id: 'chunk-doc-1-1',
            chunkIndex: 1,
            content: 'This chunk mentions Test Entity.',
            documentId: 'doc-1',
            document: { __typename: 'Document', id: 'doc-1', title: 'Getting Started', createdAt },
          },
        },
      ],
    },
  };

  claimsStore = [
    {
      __typename: 'Claim',
      id: 'claim-1',
      text: 'Test Entity is mentioned in Getting Started.',
      status: 'DRAFT',
      createdAt,
      evidence: [
        {
          __typename: 'ClaimEvidence',
          id: 'cev-1',
          claimId: 'claim-1',
          documentId: 'doc-1',
          createdAt,
          mentionIds: ['mention-1'],
          relationshipIds: [],
        },
      ],
    },
    {
      __typename: 'Claim',
      id: 'claim-2',
      text: 'Getting Started contains a specific mention span for Test Entity.',
      status: 'REVIEWED',
      createdAt,
      evidence: [
        {
          __typename: 'ClaimEvidence',
          id: 'cev-2',
          claimId: 'claim-2',
          documentId: 'doc-1',
          createdAt,
          mentionIds: ['mention-1'],
          relationshipIds: [],
        },
      ],
    },
  ];
}

function failContract(message: string): never {
  throw new Error(`[E2E contract] ${message}`);
}

let cachedSchemaMutationFields: Set<string> | null = null;

function schemaGqlPathFromHere(): string {
  // This file lives at: aletheia-frontend/e2e/helpers/msw-handlers.ts
  // Authoritative schema is at repo root: src/schema.gql
  const candidates = [
    // helpers -> e2e -> aletheia-frontend -> aletheia
    path.resolve(__dirname, '../../../src/schema.gql'),
    // Historical / alternate execution roots (defensive)
    path.resolve(__dirname, '../../../../src/schema.gql'),
    path.resolve(process.cwd(), '../src/schema.gql'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return candidates[0]!;
}

function readSchemaMutationFields(): Set<string> {
  if (cachedSchemaMutationFields) return cachedSchemaMutationFields;

  const schemaPath = schemaGqlPathFromHere();
  const text = fs.readFileSync(schemaPath, 'utf8');

  const match = text.match(/type\s+Mutation\s*\{([\s\S]*?)\}\s*/m);
  if (!match) failContract(`Unable to locate "type Mutation" in schema at ${schemaPath}`);

  const block = match[1] ?? '';
  const names = new Set<string>();
  const re = /^\s*([_A-Za-z][_0-9A-Za-z]*)\s*\(/gm;
  let m: RegExpExecArray | null = re.exec(block);
  while (m) {
    if (m[1]) names.add(m[1]);
    m = re.exec(block);
  }

  cachedSchemaMutationFields = names;
  return names;
}

function extractMutationFieldName(query: string): string | null {
  // Minimal extraction: first selected field in the mutation selection set.
  // Example:
  //   mutation AssignReviewer(...) { assignReviewer(...) { ... } }
  const m = query.match(/\bmutation\b[\s\S]*?\{\s*([_A-Za-z][_0-9A-Za-z]*)\b/);
  return m?.[1] ?? null;
}

function assertNoForbiddenRequestedFields(query: string, operationName?: string) {
  // Confidence is forbidden by the authoritative schema snapshot.
  if (/\bconfidence\b/i.test(query)) failContract(`Forbidden field requested in ${operationName ?? '(missing operationName)'}: confidence`);
  if (/\bprobability\b/i.test(query)) failContract(`Forbidden field requested in ${operationName ?? '(missing operationName)'}: probability`);
  if (/\btruthScore\b/i.test(query)) failContract(`Forbidden field requested in ${operationName ?? '(missing operationName)'}: truthScore`);

  // Reviewer coordination UI must not request claim lifecycle fields.
  // (Claim detail surfaces legitimately do; we scope this guard by operationName.)
  const op = String(operationName ?? '');
  const isReviewerCoordinationOp =
    /^(ReviewQueue|MyReviewRequests|AssignReviewer|RespondToReviewAssignment)$/i.test(op) ||
    /review-?queue/i.test(op);
  if (isReviewerCoordinationOp) {
    const forbidden = ['reviewedAt', 'reviewedBy', 'reviewerNote', 'ClaimLifecycleState'];
    for (const f of forbidden) {
      if (new RegExp(`\\b${f}\\b`).test(query)) {
        failContract(`Forbidden claim lifecycle field requested in ${operationName ?? '(missing operationName)'}: ${f}`);
      }
    }
  }

  // Claim lifecycle mutations (truth-adjacent) must never be invoked from the mocked E2E surface.
  const isMutation = /\bmutation\b/i.test(query);
  if (isMutation) {
    const mutationFieldName = extractMutationFieldName(query);
    const schemaMutations = readSchemaMutationFields();
    if (!mutationFieldName) {
      failContract(`Mutation attempted without parseable field name in ${operationName ?? '(missing operationName)'}`);
    }
    if (mutationFieldName && !schemaMutations.has(mutationFieldName)) {
      failContract(
        `Mutation not declared in schema.gql attempted in ${operationName ?? '(missing operationName)'}: ${mutationFieldName}`,
      );
    }

    if (
      mutationFieldName === 'adjudicateClaim' ||
      /\badjudicateClaim\b/i.test(query) ||
      /adjudicate/i.test(String(operationName ?? '')) ||
      /lifecycle/i.test(String(operationName ?? ''))
    ) {
      failContract(`Forbidden claim lifecycle mutation attempted in ${operationName ?? '(missing operationName)'}`);
    }

    // Extra belt-and-suspenders: any "claim*-mutation" surface is treated as lifecycle-adjacent,
    // except explicit coordination-only surfaces.
    if (
      mutationFieldName &&
      /\bclaim\b/i.test(mutationFieldName) &&
      mutationFieldName !== 'requestReview'
    ) {
      failContract(`Forbidden claim lifecycle mutation attempted in ${operationName ?? '(missing operationName)'}`);
    }
  }
}

function buildDocumentSource(documentId: string, createdAt: string) {
  return {
    __typename: 'DocumentSource',
    id: `source-${documentId}`,
    documentId,
    kind: 'URL',
    ingestedAt: createdAt,
    accessedAt: createdAt,
    publishedAt: null,
    author: null,
    publisher: null,
    filename: null,
    mimeType: null,
    contentType: null,
    sizeBytes: null,
    requestedUrl: 'https://example.com/getting-started',
    fetchedUrl: 'https://example.com/getting-started',
    contentSha256: null,
    fileSha256: null,
    lastModifiedMs: null,
  };
}

function buildDocumentCore(documentId: string) {
  const doc = documentsStore.find((d) => d.id === documentId);
  if (!doc) return null;
  return {
    __typename: 'Document',
    id: doc.id,
    title: doc.title,
    createdAt: doc.createdAt,
    sourceType: 'URL',
    sourceLabel: 'example.com',
    source: buildDocumentSource(doc.id, doc.createdAt),
  };
}

function buildDocumentEvidenceView(documentId: string) {
  const core = buildDocumentCore(documentId);
  if (!core) return null;
  return {
    ...core,
    chunks: (chunksStore[documentId] ?? []).map((c) => ({
      __typename: 'DocumentChunk',
      id: c.id,
      chunkIndex: c.chunkIndex,
      content: c.content,
      documentId,
      mentions: mentionsStore.filter((m) => m.chunkId === c.id),
    })),
  };
}

function ensureMentionForChunk(args: { documentId: string; chunkId: string; content: string }) {
  const { documentId, chunkId, content } = args;
  const existing = mentionsStore.find((m) => m && typeof m === 'object' && (m as { chunkId?: unknown }).chunkId === chunkId);
  if (existing) return;

  const entityId = 'entity-ingested';
  if (!entitiesStore.some((e) => e.id === entityId)) {
    entitiesStore = [
      ...entitiesStore,
      { id: entityId, name: 'Ingested Entity', type: 'Ingested', mentionCount: 1 },
    ];
  }

  const startOffset = 0;
  const endOffset = Math.min(12, Math.max(2, content.length));
  const mention = {
    __typename: 'EntityMention',
    id: `mention-${chunkId}`,
    entityId,
    chunkId,
    startOffset,
    endOffset,
    excerpt: content.slice(startOffset, endOffset),
    entity: { __typename: 'Entity', id: entityId, name: 'Ingested Entity', type: 'Ingested', mentionCount: 1 },
  };
  mentionsStore = [...mentionsStore, mention];

  // Minimal entity detail so entity pages can load if selected.
  if (!(entityId in entityDetailStore)) {
    entityDetailStore[entityId] = {
      __typename: 'Entity',
      id: entityId,
      name: 'Ingested Entity',
      type: 'Ingested',
      mentionCount: 1,
      outgoing: [],
      incoming: [],
      mentions: [
        {
          ...mention,
          chunk: {
            __typename: 'DocumentChunk',
            id: chunkId,
            chunkIndex: 0,
            content,
            documentId,
            document: {
              __typename: 'Document',
              id: documentId,
              title: documentsStore.find((d) => d.id === documentId)?.title ?? documentId,
              createdAt: documentsStore.find((d) => d.id === documentId)?.createdAt ?? new Date().toISOString(),
            },
          },
        },
      ],
    };
  }
}

function assertNoConfidence(value: unknown, path = 'root', seen = new Set<object>()) {
  if (value === null || value === undefined) return;

  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i += 1) {
      assertNoConfidence(value[i], `${path}[${i}]`, seen);
    }
    return;
  }

  if (typeof value !== 'object') return;
  if (seen.has(value as object)) return;
  seen.add(value as object);

  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    const key = k.toLowerCase();
    if (key.includes('confidence')) {
      throw new Error(`[E2E contract] Unexpected confidence field "${k}" at ${path}.${k}`);
    }
    if (key.includes('probability')) {
      throw new Error(`[E2E contract] Unexpected probability field "${k}" at ${path}.${k}`);
    }
    if (key.includes('truthscore')) {
      throw new Error(`[E2E contract] Unexpected truthScore field "${k}" at ${path}.${k}`);
    }
    assertNoConfidence(v, `${path}.${k}`, seen);
  }
}

/**
 * Setup GraphQL route handlers for Playwright
 * This intercepts GraphQL requests and returns mock responses
 */
export async function setupGraphQLMocks(route: Route) {
  const url = route.request().url();
  const method = route.request().method();
  
  // Only intercept GraphQL requests
  if (!url.includes('/graphql') || (method !== 'POST' && method !== 'GET')) {
    await route.continue();
    return;
  }

  try {
    let parsedBody: {
      operationName?: string;
      query?: string;
      variables?: Record<string, unknown>;
    };

    if (method === 'GET') {
      const u = new URL(url);
      const query = u.searchParams.get('query') ?? undefined;
      const operationName = u.searchParams.get('operationName') ?? undefined;
      const variablesRaw = u.searchParams.get('variables');
      parsedBody = {
        query,
        operationName,
        variables: variablesRaw ? (JSON.parse(variablesRaw) as Record<string, unknown>) : undefined,
      };
    } else {
      // POST
      const body = await route.request().postData();
      if (!body) {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            errors: [{ message: 'Invalid request body', extensions: { code: 'BAD_USER_INPUT' } }],
          }),
        });
        return;
      }
      parsedBody = JSON.parse(body);
    }

    // Extract operation name from query string if not provided
    let operationName = parsedBody.operationName;
    if (!operationName && parsedBody.query) {
      const match = parsedBody.query.match(/(?:query|mutation)\s+(\w+)/);
      operationName = match?.[1];
    }

    if (typeof parsedBody.query === 'string' && parsedBody.query) {
      assertNoForbiddenRequestedFields(parsedBody.query, operationName);
    }

    // Handle different GraphQL operations
    let response: { status: number; body: unknown };

    switch (operationName) {
      case 'Hello':
        response = {
          status: 200,
          body: {
            data: {
              hello: 'Hello from Aletheia!',
            },
          },
        };
        break;

      case 'Login': {
        const email = varString(parsedBody.variables, 'email');
        const password = varString(parsedBody.variables, 'password');
        if (
          (email === 'test@example.com' && password === 'password123') ||
          (email === 'admin@example.com' && password === 'password123')
        ) {
          // Reset per-login to keep tests isolated/deterministic
          documentsStore = [];
          chunksStore = {};
          entitiesStore = [];
          mentionsStore = [];
          relationshipsStore = [];
          entityDetailStore = {};
          claimsStore = [];
          reviewRequestsStore = [];
          reviewAssignmentsStore = [];
          reviewerResponsesSeq = 0;
          ensureSeeded();

          const isAdmin = email === 'admin@example.com';
          response = {
            status: 200,
            body: {
              data: {
                login: createMockJwt({
                  sub: isAdmin ? 'admin-1' : 'user-1',
                  email,
                  role: isAdmin ? 'ADMIN' : 'USER',
                }),
              },
            },
          };
        } else {
          response = {
            status: 401,
            body: {
              errors: [{
                message: 'Invalid email or password',
                extensions: { code: 'UNAUTHENTICATED' },
              }],
            },
          };
        }
        break;
      }

      case 'Register': {
        const email = varString(parsedBody.variables, 'email');
        if (email === 'exists@example.com') {
          response = {
            status: 400,
            body: {
              errors: [{
                message: 'Email already exists',
                extensions: { code: 'BAD_USER_INPUT' },
              }],
            },
          };
        } else {
          response = {
            status: 200,
            body: {
              data: {
                register: 'mock-jwt-token-new-user',
              },
            },
          };
        }
        break;
      }

      case 'ChangePassword': {
        const currentPassword = varString(parsedBody.variables, 'currentPassword');
        if (currentPassword === 'wrong-password') {
          response = {
            status: 401,
            body: {
              errors: [{
                message: 'Current password is incorrect',
                extensions: { code: 'UNAUTHENTICATED' },
              }],
            },
          };
        } else {
          response = {
            status: 200,
            body: {
              data: {
                changePassword: true,
              },
            },
          };
        }
        break;
      }

      case 'ForgotPassword': {
        const email = varString(parsedBody.variables, 'email');
        if (email === 'notfound@example.com') {
          response = {
            status: 404,
            body: {
              errors: [{
                message: 'No account found with this email address',
                extensions: { code: 'NOT_FOUND' },
              }],
            },
          };
        } else {
          response = {
            status: 200,
            body: {
              data: {
                forgotPassword: true,
              },
            },
          };
        }
        break;
      }

      case 'DocumentsByUser': {
        ensureSeeded();
        response = {
          status: 200,
          body: {
            data: {
              documentsByUser: documentsStore.map((d) => ({
                __typename: 'Document',
                id: d.id,
                title: d.title,
                createdAt: d.createdAt,
              })),
            },
          },
        };
        break;
      }

      case 'ListDocuments': {
        response = {
          status: 200,
          body: {
            data: {
              documents: documentsStore.map((d) => {
                const chunks = chunksStore[d.id] ?? [];
                const sourceId = `source-${d.id}`;
                return {
                  __typename: 'Document',
                  id: d.id,
                  title: d.title,
                  createdAt: d.createdAt,
                  sourceType: 'URL',
                  sourceLabel: 'example.com',
                  source: {
                    __typename: 'DocumentSource',
                    id: sourceId,
                    documentId: d.id,
                    kind: 'URL',
                    ingestedAt: d.createdAt,
                    accessedAt: d.createdAt,
                    publishedAt: null,
                    author: null,
                    publisher: null,
                    filename: null,
                    mimeType: null,
                    contentType: null,
                    sizeBytes: null,
                    requestedUrl: 'https://example.com/getting-started',
                    fetchedUrl: 'https://example.com/getting-started',
                    contentSha256: null,
                    fileSha256: null,
                    lastModifiedMs: null,
                  },
                  chunks: chunks.map((c) => ({
                    __typename: 'DocumentChunk',
                    id: c.id,
                  })),
                };
              }),
            },
          },
        };
        break;
      }

      case 'GetDocumentIntelligence': {
        ensureSeeded();
        const id = varString(parsedBody.variables, 'id') ?? '';
        const doc = documentsStore.find((d) => d.id === id) ?? null;
        response = {
          status: 200,
          body: {
            data: {
              document: doc
                ? {
                    __typename: 'Document',
                    id: doc.id,
                    title: doc.title,
                    createdAt: doc.createdAt,
                    sourceType: 'URL',
                    sourceLabel: 'example.com',
                    source: {
                      __typename: 'DocumentSource',
                      id: `source-${doc.id}`,
                      documentId: doc.id,
                      kind: 'URL',
                      ingestedAt: doc.createdAt,
                      accessedAt: doc.createdAt,
                      publishedAt: null,
                      author: null,
                      publisher: null,
                      filename: null,
                      mimeType: null,
                      contentType: null,
                      sizeBytes: null,
                      requestedUrl: 'https://example.com/getting-started',
                      fetchedUrl: 'https://example.com/getting-started',
                      contentSha256: null,
                      fileSha256: null,
                      lastModifiedMs: null,
                    },
                    chunks: (chunksStore[doc.id] ?? []).map((c) => ({
                      __typename: 'DocumentChunk',
                      id: c.id,
                      chunkIndex: c.chunkIndex,
                      content: c.content,
                      documentId: doc.id,
                      mentions: mentionsStore.filter((m) => m.chunkId === c.id),
                    })),
                  }
                : null,
              entityRelationships: relationshipsStore,
            },
          },
        };
        break;
      }

      case 'GetDocumentEvidenceView': {
        ensureSeeded();
        const id = varString(parsedBody.variables, 'id') ?? '';
        const doc = documentsStore.find((d) => d.id === id) ?? null;
        response = {
          status: 200,
          body: {
            data: {
              document: doc
                ? {
                    __typename: 'Document',
                    id: doc.id,
                    title: doc.title,
                    createdAt: doc.createdAt,
                    sourceType: 'URL',
                    sourceLabel: 'example.com',
                    source: {
                      __typename: 'DocumentSource',
                      id: `source-${doc.id}`,
                      documentId: doc.id,
                      kind: 'URL',
                      ingestedAt: doc.createdAt,
                      accessedAt: doc.createdAt,
                      publishedAt: null,
                      author: null,
                      publisher: null,
                      filename: null,
                      mimeType: null,
                      contentType: null,
                      sizeBytes: null,
                      requestedUrl: 'https://example.com/getting-started',
                      fetchedUrl: 'https://example.com/getting-started',
                      contentSha256: null,
                      fileSha256: null,
                      lastModifiedMs: null,
                    },
                    chunks: (chunksStore[doc.id] ?? []).map((c) => ({
                      __typename: 'DocumentChunk',
                      id: c.id,
                      chunkIndex: c.chunkIndex,
                      content: c.content,
                      documentId: doc.id,
                      mentions: mentionsStore.filter((m) => m.chunkId === c.id),
                    })),
                  }
                : null,
            },
          },
        };
        break;
      }

      case 'DocumentIndexByUser': {
        ensureSeeded();
        // Documents index used by the evidence-first Documents library UI.
        response = {
          status: 200,
          body: {
            data: {
              documentsByUser: documentsStore.map((d) => ({
                __typename: 'Document',
                id: d.id,
                title: d.title,
                createdAt: d.createdAt,
                sourceType: 'URL',
                sourceLabel: 'example.com',
                chunks: (chunksStore[d.id] ?? []).map((c) => ({
                  __typename: 'DocumentChunk',
                  id: c.id,
                  chunkIndex: c.chunkIndex,
                  mentions: mentionsStore.filter((m) => m.chunkId === c.id),
                })),
              })),
            },
          },
        };
        break;
      }

      case 'Document': {
        ensureSeeded();
        const id = varString(parsedBody.variables, 'id');
        const doc = documentsStore.find((d) => d.id === id);
        response = {
          status: 200,
          body: {
            data: {
              document: doc
                ? {
                    __typename: 'Document',
                    id: doc.id,
                    title: doc.title,
                    createdAt: doc.createdAt,
                  }
                : null,
            },
          },
        };
        break;
      }

      case 'ChunksByDocument': {
        ensureSeeded();
        const documentId = varString(parsedBody.variables, 'documentId') ?? '';
        response = {
          status: 200,
          body: {
            data: {
              chunksByDocument: (chunksStore[documentId] ?? []).map((c) => ({
                __typename: 'DocumentChunk',
                id: c.id,
                chunkIndex: c.chunkIndex,
                content: c.content,
                mentions: mentionsStore.filter((m) => m.chunkId === c.id),
              })),
            },
          },
        };
        break;
      }

      case 'Chunk0ByDocument': {
        ensureSeeded();
        const documentId = varString(parsedBody.variables, 'documentId') ?? '';
        const doc = documentsStore.find((d) => d.id === documentId);
        const chunk0 = (chunksStore[documentId] ?? []).find((c) => c.chunkIndex === 0) ?? null;
        response = {
          status: 200,
          body: {
            data: {
              chunk0ByDocument:
                doc && chunk0
                  ? {
                      __typename: 'DocumentChunk',
                      id: chunk0.id,
                      chunkIndex: chunk0.chunkIndex,
                      content: chunk0.content,
                      documentId,
                      document: {
                        __typename: 'Document',
                        id: doc.id,
                        title: doc.title,
                        createdAt: doc.createdAt,
                      },
                    }
                  : null,
            },
          },
        };
        break;
      }

      case 'ListClaims': {
        ensureSeeded();
        response = {
          status: 200,
          body: {
            data: {
              claims: claimsStore.map((c) => {
                const evidence = (c as { evidence?: Array<{ documentId?: string }> }).evidence ?? [];
                const docIds = Array.from(new Set(evidence.map((e) => String(e.documentId ?? '')).filter(Boolean)));
                return {
                  ...c,
                  documents: docIds.map((id) => buildDocumentCore(id)).filter(Boolean),
                };
              }),
            },
          },
        };
        break;
      }

      case 'RequestReview': {
        ensureSeeded();
        const authHeader = route.request().headers()['authorization'] ?? '';
        if (!authHeader) {
          response = {
            status: 200,
            body: { errors: [{ message: 'UNAUTHORIZED', extensions: { code: 'UNAUTHORIZED' } }] },
          };
          break;
        }

        const token = authHeader.replace(/^Bearer\s+/i, '');
        const payload = parseJwt(token);
        const requestedById = typeof payload?.sub === 'string' ? payload.sub : 'user-1';
        const requestedByEmail = typeof payload?.email === 'string' ? payload.email : 'test@example.com';
        const requestedByName = requestedById === 'admin-1' ? 'Admin User' : 'Test User';

        const claimId = varString(parsedBody.variables, 'claimId') ?? '';
        const source = varString(parsedBody.variables, 'source') ?? '';
        const note = varString(parsedBody.variables, 'note');
        const claimExists = claimsStore.some((c) => (c as { id?: string }).id === claimId);
        if (!claimExists) {
          response = {
            status: 200,
            body: { errors: [{ message: 'CLAIM_NOT_FOUND', extensions: { code: 'CLAIM_NOT_FOUND' } }] },
          };
          break;
        }

        const requestedBy = { __typename: 'User', id: requestedById, email: requestedByEmail, name: requestedByName };
        const dup = reviewRequestsStore.some(
          (rr) =>
            (rr as { claimId?: string; requestedBy?: { id?: string } }).claimId === claimId &&
            (rr as { requestedBy?: { id?: string } }).requestedBy?.id === requestedBy.id
        );
        if (dup) {
          response = {
            status: 200,
            body: { errors: [{ message: 'DUPLICATE_REVIEW_REQUEST', extensions: { code: 'DUPLICATE_REVIEW_REQUEST' } }] },
          };
          break;
        }

        const createdAt = new Date().toISOString();
        const created = {
          __typename: 'ReviewRequest',
          id: `rr-${reviewRequestsStore.length + 1}`,
          claimId,
          requestedAt: createdAt,
          source,
          note: note ?? null,
          requestedBy,
          reviewAssignments: [],
        };
        reviewRequestsStore = [created, ...reviewRequestsStore];
        response = { status: 200, body: { data: { requestReview: created } } };
        break;
      }

      case 'AssignReviewer': {
        ensureSeeded();
        const authHeader = route.request().headers()['authorization'] ?? '';
        if (!authHeader) {
          response = { status: 200, body: { errors: [{ message: 'UNAUTHORIZED', extensions: { code: 'UNAUTHORIZED' } }] } };
          break;
        }

        const token = authHeader.replace(/^Bearer\s+/i, '');
        const payload = parseJwt(token);
        const assignedByUserId = typeof payload?.sub === 'string' ? payload.sub : null;
        const role = typeof payload?.role === 'string' ? payload.role : null;
        if (!assignedByUserId || role !== 'ADMIN') {
          response = { status: 200, body: { errors: [{ message: 'UNAUTHORIZED', extensions: { code: 'UNAUTHORIZED' } }] } };
          break;
        }

        const reviewRequestId = varString(parsedBody.variables, 'reviewRequestId') ?? '';
        const reviewerUserId = varString(parsedBody.variables, 'reviewerUserId') ?? '';

        const rr = reviewRequestsStore.find((x) => (x as { id?: string }).id === reviewRequestId) as
          | (Record<string, unknown> & { id: string; reviewAssignments?: unknown })
          | undefined;
        if (!rr) {
          response = {
            status: 200,
            body: { errors: [{ message: 'REVIEW_REQUEST_NOT_FOUND', extensions: { code: 'REVIEW_REQUEST_NOT_FOUND' } }] },
          };
          break;
        }

        if (!reviewerUserId) {
          response = {
            status: 200,
            body: { errors: [{ message: 'REVIEWER_NOT_ELIGIBLE', extensions: { code: 'REVIEWER_NOT_ELIGIBLE' } }] },
          };
          break;
        }

        const existingAssignments = Array.isArray(rr.reviewAssignments) ? rr.reviewAssignments : [];
        if (existingAssignments.some((a) => (a as { reviewerUserId?: string }).reviewerUserId === reviewerUserId)) {
          response = {
            status: 200,
            body: { errors: [{ message: 'DUPLICATE_ASSIGNMENT', extensions: { code: 'DUPLICATE_ASSIGNMENT' } }] },
          };
          break;
        }

        const createdAt = new Date().toISOString();
        const created = {
          __typename: 'ReviewAssignment',
          id: `ra-${reviewAssignmentsStore.length + 1}`,
          reviewRequestId,
          reviewerUserId,
          assignedByUserId,
          assignedAt: createdAt,
          reviewerResponse: null,
        };
        reviewAssignmentsStore = [created, ...reviewAssignmentsStore];
        rr.reviewAssignments = [created, ...existingAssignments];

        response = { status: 200, body: { data: { assignReviewer: created } } };
        break;
      }

      case 'RespondToReviewAssignment': {
        ensureSeeded();
        const authHeader = route.request().headers()['authorization'] ?? '';
        if (!authHeader) {
          response = { status: 200, body: { errors: [{ message: 'UNAUTHORIZED', extensions: { code: 'UNAUTHORIZED' } }] } };
          break;
        }

        const token = authHeader.replace(/^Bearer\s+/i, '');
        const payload = parseJwt(token);
        const userId = typeof payload?.sub === 'string' ? payload.sub : null;
        if (!userId) {
          response = { status: 200, body: { errors: [{ message: 'UNAUTHORIZED', extensions: { code: 'UNAUTHORIZED' } }] } };
          break;
        }

        const reviewAssignmentId = varString(parsedBody.variables, 'reviewAssignmentId') ?? '';
        const resp = varString(parsedBody.variables, 'response') ?? '';
        const note = varString(parsedBody.variables, 'note');

        if (!reviewAssignmentId || (resp !== 'ACKNOWLEDGED' && resp !== 'DECLINED')) {
          response = { status: 200, body: { errors: [{ message: 'BAD_USER_INPUT', extensions: { code: 'BAD_USER_INPUT' } }] } };
          break;
        }

        const assignment = reviewAssignmentsStore.find((a) => (a as { id?: string }).id === reviewAssignmentId) as
          | (Record<string, unknown> & { id: string; reviewerUserId?: string; reviewerResponse?: unknown })
          | undefined;
        if (!assignment) {
          response = { status: 200, body: { errors: [{ message: 'ASSIGNMENT_NOT_FOUND', extensions: { code: 'ASSIGNMENT_NOT_FOUND' } }] } };
          break;
        }

        if (assignment.reviewerUserId !== userId) {
          response = { status: 200, body: { errors: [{ message: 'NOT_ASSIGNED_REVIEWER', extensions: { code: 'NOT_ASSIGNED_REVIEWER' } }] } };
          break;
        }

        if (assignment.reviewerResponse) {
          response = { status: 200, body: { errors: [{ message: 'DUPLICATE_RESPONSE', extensions: { code: 'DUPLICATE_RESPONSE' } }] } };
          break;
        }

        const createdAt = new Date().toISOString();
        const created = {
          __typename: 'ReviewerResponse',
          id: `resp-${(reviewerResponsesSeq += 1)}`,
          reviewAssignmentId,
          reviewerUserId: userId,
          response: resp,
          respondedAt: createdAt,
          note: note ?? null,
        };

        assignment.reviewerResponse = created;

        response = { status: 200, body: { data: { respondToReviewAssignment: created } } };
        break;
      }

      case 'ReviewQueue': {
        ensureSeeded();
        // Ensure schema-faithful shape: every ReviewRequest includes reviewAssignments.
        const hydrated = reviewRequestsStore.map((rr) => ({
          ...rr,
          reviewAssignments: Array.isArray((rr as { reviewAssignments?: unknown }).reviewAssignments)
            ? (rr as { reviewAssignments: unknown[] }).reviewAssignments
            : [],
        }));
        response = { status: 200, body: { data: { reviewQueue: hydrated } } };
        break;
      }

      case 'MyReviewRequests': {
        ensureSeeded();
        const requestedById = 'user-1';
        const mine = reviewRequestsStore.filter(
          (rr) => (rr as { requestedBy?: { id?: string } }).requestedBy?.id === requestedById
        );
        const hydrated = mine.map((rr) => ({
          ...rr,
          reviewAssignments: Array.isArray((rr as { reviewAssignments?: unknown }).reviewAssignments)
            ? (rr as { reviewAssignments: unknown[] }).reviewAssignments
            : [],
        }));
        response = { status: 200, body: { data: { myReviewRequests: hydrated } } };
        break;
      }

      case 'ClaimsByDocument': {
        ensureSeeded();
        const documentId = varString(parsedBody.variables, 'documentId') ?? '';
        response = {
          status: 200,
          body: {
            data: {
              claimsByDocument: claimsStore
                .filter((c) => (c as { evidence?: Array<{ documentId?: string }> }).evidence?.some((e) => e.documentId === documentId))
                .map((c) => ({
                  ...c,
                  documents: [buildDocumentCore(documentId)].filter(Boolean),
                })),
            },
          },
        };
        break;
      }

      case 'GetClaimsForComparison': {
        ensureSeeded();
        response = {
          status: 200,
          body: {
            data: {
              claims: claimsStore.map((c) => {
                const evidence = (c as { evidence?: Array<{ documentId?: string }> }).evidence ?? [];
                const docIds = Array.from(new Set(evidence.map((e) => String(e.documentId ?? '')).filter(Boolean)));
                return {
                  ...c,
                  documents: docIds.map((id) => buildDocumentEvidenceView(id)).filter(Boolean),
                };
              }),
            },
          },
        };
        break;
      }

      case 'Entities': {
        ensureSeeded();
        response = {
          status: 200,
          body: {
            data: {
              entities: entitiesStore.map((e) => ({
                __typename: 'Entity',
                id: e.id,
                name: e.name,
                type: e.type,
                mentionCount: e.mentionCount,
              })),
            },
          },
        };
        break;
      }

      case 'ListEntities': {
        ensureSeeded();
        response = {
          status: 200,
          body: {
            data: {
              entities: entitiesStore.map((e) => ({
                __typename: 'Entity',
                id: e.id,
                name: e.name,
                type: e.type,
                mentionCount: e.mentionCount,
              })),
            },
          },
        };
        break;
      }

      case 'Entity': {
        ensureSeeded();
        const id = varString(parsedBody.variables, 'id');
        response = {
          status: 200,
          body: {
            data: {
              entity: entityDetailStore[String(id)] ?? null,
            },
          },
        };
        break;
      }

      case 'CreateDocument': {
        ensureSeeded();
        const title = varString(parsedBody.variables, 'title') ?? '';
        const newDoc = {
          id: `doc-${documentsStore.length + 1}`,
          title,
          createdAt: new Date().toISOString(),
        };
        documentsStore = [...documentsStore, newDoc];
        chunksStore[newDoc.id] = [];
        response = {
          status: 200,
          body: {
            data: {
              createDocument: { __typename: 'Document', ...newDoc },
            },
          },
        };
        break;
      }

      case 'CreateChunk': {
        ensureSeeded();
        const documentId = varString(parsedBody.variables, 'documentId');
        const chunkIndex = varNumber(parsedBody.variables, 'chunkIndex') ?? 0;
        const content = varString(parsedBody.variables, 'content') ?? '';
        if (!documentId || !documentsStore.some((d) => d.id === documentId)) {
          response = {
            status: 400,
            body: {
              errors: [
                {
                  message: `Document not found: ${String(documentId ?? '')}`,
                  extensions: { code: 'BAD_USER_INPUT' },
                },
              ],
            },
          };
          break;
        }
        const docId = documentId;
        const newChunk = {
          id: `chunk-${String(docId)}-${String(chunkIndex)}`,
          chunkIndex,
          content,
        };
        chunksStore[docId] = [...(chunksStore[docId] ?? []), newChunk].sort(
          (a, b) => a.chunkIndex - b.chunkIndex
        );

        // Ensure the Truth Surface can render: new documents must have at least one mention with valid offsets.
        // We create a minimal mention for chunk 0 only (deterministic).
        if (newChunk.chunkIndex === 0) {
          ensureMentionForChunk({ documentId: docId, chunkId: newChunk.id, content: newChunk.content });
        }

        response = {
          status: 200,
          body: {
            data: {
              createChunk: {
                __typename: 'DocumentChunk',
                id: newChunk.id,
                chunkIndex: newChunk.chunkIndex,
                content: newChunk.content,
                documentId: String(docId),
              },
            },
          },
        };
        break;
      }

      case 'DeleteDocument': {
        ensureSeeded();
        const id = varString(parsedBody.variables, 'id') ?? '';
        documentsStore = documentsStore.filter((d) => d.id !== id);
        delete chunksStore[id];
        mentionsStore = mentionsStore.filter((m) => (m as { chunkId?: string }).chunkId ? !(m as { chunkId: string }).chunkId.startsWith(`chunk-${id}-`) : true);
        response = {
          status: 200,
          body: {
            data: {
              deleteDocument: { __typename: 'Document', id },
            },
          },
        };
        break;
      }

      default:
        // Some clients omit `operationName` in the request body. Fall back to a simple query-shape match
        // for the small set of operations used in our E2E suite.
        if (typeof parsedBody.query === 'string' && parsedBody.query.includes('documentsByUser')) {
          const wantsChunks = parsedBody.query.includes('chunks {') || parsedBody.query.includes('chunks{');
          if (wantsChunks) {
            response = {
              status: 200,
              body: {
                data: {
                  documentsByUser: documentsStore.map((d) => ({
                    __typename: 'Document',
                    id: d.id,
                    title: d.title,
                    createdAt: d.createdAt,
                    chunks: (chunksStore[d.id] ?? []).map((c) => ({
                      __typename: 'DocumentChunk',
                      id: c.id,
                      chunkIndex: c.chunkIndex,
                      mentions: [],
                    })),
                  })),
                },
              },
            };
            break;
          }

          response = {
            status: 200,
            body: {
              data: {
                documentsByUser: documentsStore,
              },
            },
          };
          break;
        }

        if (typeof parsedBody.query === 'string' && parsedBody.query.includes('entities')) {
          response = {
            status: 200,
            body: {
              data: {
                entities: entitiesStore.map((e) => ({
                  __typename: 'Entity',
                  id: e.id,
                  name: e.name,
                  type: e.type,
                  mentionCount: e.mentionCount,
                })),
              },
            },
          };
          break;
        }

        if (typeof parsedBody.query === 'string' && parsedBody.query.includes('entityRelationships')) {
          response = {
            status: 200,
            body: {
              data: {
                entityRelationships: relationshipsStore,
              },
            },
          };
          break;
        }

        if (typeof operationName === 'string' && operationName.toLowerCase().includes('entities')) {
          response = {
            status: 200,
            body: {
              data: {
                entities: entitiesStore.map((e) => ({
                  __typename: 'Entity',
                  id: e.id,
                  name: e.name,
                  type: e.type,
                  mentionCount: e.mentionCount,
                })),
              },
            },
          };
          break;
        }

        // Unknown operation: fail loudly to preserve the "no real backend" contract in E2E.
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            errors: [
              {
                message: `Unhandled GraphQL operation in E2E mocks: ${String(operationName ?? '(missing operationName)')}`,
                extensions: { code: 'E2E_UNHANDLED_OPERATION' },
              },
            ],
          }),
        });
        return;
    }

    assertNoConfidence(response.body, 'response.body');
    await route.fulfill({
      status: response.status,
      contentType: 'application/json',
      body: JSON.stringify(response.body),
    });
  } catch (error) {
    // If parsing fails, continue with actual request
    console.error('Error parsing GraphQL request:', error);
    await route.continue();
  }
}
