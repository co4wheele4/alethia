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

/**
 * Setup GraphQL route handlers for Playwright
 * This intercepts GraphQL requests and returns mock responses
 */
export async function setupGraphQLMocks(route: Route) {
  const url = route.request().url();
  
  // Only intercept GraphQL requests
  if (!url.includes('/graphql') || route.request().method() !== 'POST') {
    await route.continue();
    return;
  }

  try {
    // Get the request body
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

    const parsedBody = JSON.parse(body);
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
        const { email, password } = parsedBody.variables || {};
        if (email === 'test@example.com' && password === 'password123') {
          // Reset per-login to keep tests isolated/deterministic
          documentsStore = [
            { id: 'doc-1', title: 'Getting Started', createdAt: new Date('2026-01-01T00:00:00Z').toISOString() },
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
          ];
          entityDetailStore = {
            'entity-1': {
              __typename: 'Entity',
              id: 'entity-1',
              name: 'Test Entity',
              type: 'TestType',
              mentionCount: 1,
              outgoing: [],
              incoming: [],
              mentions: [
                {
                  __typename: 'EntityMention',
                  id: 'mention-1',
                  startOffset: 17,
                  endOffset: 28,
                  spanText: 'Test Entity',
                  confidence: 0.9,
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
                      createdAt: new Date('2026-01-01T00:00:00Z').toISOString(),
                    },
                  },
                },
              ],
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
        const { email } = parsedBody.variables || {};
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
        const { currentPassword } = parsedBody.variables || {};
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
        const { email } = parsedBody.variables || {};
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

      case 'Document': {
        const { id } = parsedBody.variables || {};
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
        const { documentId } = parsedBody.variables || {};
        response = {
          status: 200,
          body: {
            data: {
              chunksByDocument: (chunksStore[documentId] ?? []).map((c) => ({
                __typename: 'DocumentChunk',
                id: c.id,
                chunkIndex: c.chunkIndex,
                content: c.content,
                mentions: [],
              })),
            },
          },
        };
        break;
      }

      case 'Chunk0ByDocument': {
        const { documentId } = parsedBody.variables || {};
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

      case 'Entity': {
        const { id } = parsedBody.variables || {};
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
        const { title } = parsedBody.variables || {};
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
        const { documentId, chunkIndex, content } = parsedBody.variables || {};
        const docExists = documentsStore.some((d) => d.id === documentId);
        if (!docExists) {
          response = {
            status: 400,
            body: {
              errors: [
                {
                  message: `Document not found: ${String(documentId)}`,
                  extensions: { code: 'BAD_USER_INPUT' },
                },
              ],
            },
          };
          break;
        }
        const newChunk = {
          id: `chunk-${String(documentId)}-${String(chunkIndex)}`,
          chunkIndex: Number(chunkIndex) || 0,
          content: String(content ?? ''),
        };
        chunksStore[documentId] = [...(chunksStore[documentId] ?? []), newChunk].sort(
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
                documentId: String(documentId),
              },
            },
          },
        };
        break;
      }

      case 'DeleteDocument': {
        const { id } = parsedBody.variables || {};
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
        // Unknown operation, continue with actual request
        await route.continue();
        return;
    }

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
