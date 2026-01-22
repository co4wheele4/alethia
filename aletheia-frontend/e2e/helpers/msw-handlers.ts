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

function base64UrlEncode(input: string): string {
  // Node supports base64url in recent versions, but keep it explicit for portability
  return Buffer.from(input).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
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
        if (email === 'test@example.com' && password === 'password123') {
          const createdAt = new Date('2026-01-01T00:00:00Z').toISOString();
          const sourceId = 'source-doc-1';
          // Reset per-login to keep tests isolated/deterministic
          documentsStore = [
            { id: 'doc-1', title: 'Getting Started', createdAt },
          ];
          chunksStore = {
            'doc-1': [
              {
                id: 'chunk-doc-1-0',
                chunkIndex: 0,
                content: 'Getting Started (chunk 0)',
              },
              {
                id: 'chunk-doc-1-1',
                chunkIndex: 1,
                content: 'This chunk mentions Test Entity.',
              },
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
                    document: {
                      __typename: 'Document',
                      id: 'doc-1',
                      title: 'Getting Started',
                      createdAt,
                    },
                  },
                },
              ],
            },
            'entity-2': {
              __typename: 'Entity',
              id: 'entity-2',
              name: 'Other Entity',
              type: 'TestType',
              mentionCount: 0,
              outgoing: [],
              incoming: [relationshipsStore[0]],
              mentions: [],
            },
          };

          response = {
            status: 200,
            body: {
              data: {
                login: createMockJwt({ sub: 'user-1', email: 'test@example.com', role: 'USER' }),
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

      case 'DocumentIndexByUser': {
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

      case 'Entities': {
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
              createDocument: newDoc,
            },
          },
        };
        break;
      }

      case 'CreateChunk': {
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
        const id = varString(parsedBody.variables, 'id') ?? '';
        documentsStore = documentsStore.filter((d) => d.id !== id);
        delete chunksStore[id];
        response = {
          status: 200,
          body: {
            data: {
              deleteDocument: { id },
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
