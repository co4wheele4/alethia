import { graphql, HttpResponse } from 'msw';

import { fixture } from './aletheia-fixtures';

function fail(message: string): never {
  // Fail fast in tests and dev: surface contract breaks immediately.
  throw new Error(`[MSW contract] ${message}`);
}

function assertPresent<T>(value: T | null | undefined, label: string): NonNullable<T> {
  if (value === null || value === undefined) fail(`${label} is missing`);
  return value as NonNullable<T>;
}

function assertNonEmptyArray<T>(value: T[] | null | undefined, label: string): T[] {
  const v = assertPresent(value, label);
  if (!Array.isArray(v) || v.length === 0) fail(`${label} must be a non-empty array`);
  return v;
}

function assertOffsets(start: number | null | undefined, end: number | null | undefined, label: string) {
  if (typeof start !== 'number' || typeof end !== 'number') {
    fail(`${label} requires numeric startOffset/endOffset (got ${String(start)}/${String(end)})`);
  }
  const s = start;
  const e = end;
  if (s < 0 || e <= s) fail(`${label} has invalid offsets (start=${s}, end=${e})`);
}

function asDocumentById(id: string) {
  const doc = fixture.documents.find((d) => d.id === id);
  if (!doc) return null;

  // Enforce provenance visibility.
  assertPresent(doc.sourceType, 'Document.sourceType');
  assertPresent(doc.sourceLabel, 'Document.sourceLabel');
  assertPresent(doc.source, 'Document.source');

  // Enforce mention offsets.
  for (const chunk of doc.chunks) {
    for (const m of chunk.mentions) {
      assertOffsets(m.startOffset, m.endOffset, `EntityMention(${m.id})`);
      assertPresent(m.entity, `EntityMention(${m.id}).entity`);
    }
  }

  return doc;
}

function listDocuments() {
  return fixture.documents.map((d) => ({
    __typename: d.__typename,
    id: d.id,
    title: d.title,
    createdAt: d.createdAt,
    sourceType: d.sourceType,
    sourceLabel: d.sourceLabel,
    source: d.source,
    chunks: d.chunks.map((c) => ({ __typename: c.__typename, id: c.id })),
  }));
}

function listEntities() {
  return fixture.entities;
}

function listRelationships() {
  // Fill required nested links without duplicating the full fixture graph in the fixture file.
  const mentionById = new Map(
    fixture.documents.flatMap((d) => d.chunks.flatMap((c) => c.mentions.map((m) => [m.id, m] as const)))
  );
  const documentById = new Map(fixture.documents.map((d) => [d.id, d] as const));

  return fixture.relationships.map((r) => {
    assertNonEmptyArray(r.evidence as unknown as unknown[], `EntityRelationship(${r.id}).evidence`);
    const evidence = r.evidence.map((ev) => {
      assertOffsets(ev.startOffset, ev.endOffset, `EntityRelationshipEvidence(${ev.id})`);
      const chunkDocument = assertPresent(documentById.get(ev.chunk.documentId), 'Evidence.chunk.document');
      const mentionLinks = ev.mentionLinks.map((ml) => {
        const mention = assertPresent(mentionById.get(ml.mentionId), `EvidenceMention(${ml.mentionId}).mention`);
        assertOffsets(mention.startOffset, mention.endOffset, `EntityMention(${mention.id})`);
        return {
          __typename: ml.__typename,
          evidenceId: ml.evidenceId,
          mentionId: ml.mentionId,
          mention,
        };
      });

      return {
        __typename: ev.__typename,
        id: ev.id,
        kind: ev.kind,
        createdAt: ev.createdAt,
        chunkId: ev.chunkId,
        startOffset: ev.startOffset,
        endOffset: ev.endOffset,
        quotedText: ev.quotedText,
        chunk: {
          __typename: ev.chunk.__typename,
          id: ev.chunk.id,
          chunkIndex: ev.chunk.chunkIndex,
          content: ev.chunk.content,
          documentId: ev.chunk.documentId,
          document: chunkDocument,
        },
        mentionLinks,
      };
    });

    return {
      __typename: r.__typename,
      id: r.id,
      relation: r.relation,
      from: r.from,
      to: r.to,
      evidence,
    };
  });
}

export const handlers = [
  // Trust UI (read-only) contracts
  graphql.query('ListDocuments', () => {
    return HttpResponse.json({ data: { documents: listDocuments() } });
  }),

  graphql.query('GetDocumentById', ({ variables }) => {
    const id = assertPresent((variables as { id?: string } | undefined)?.id, 'GetDocumentById.variables.id');
    const doc = asDocumentById(id);
    return HttpResponse.json({ data: { document: doc } });
  }),

  graphql.query('ListEntities', () => {
    return HttpResponse.json({ data: { entities: listEntities() } });
  }),

  graphql.query('ListRelationships', () => {
    return HttpResponse.json({ data: { entityRelationships: listRelationships() } });
  }),

  // Existing app-level auth contracts used by tests/components
  graphql.query('Hello', () => {
    return HttpResponse.json({
      data: {
        hello: 'Hello from Aletheia!',
      },
    });
  }),

  graphql.mutation('Login', async ({ request }) => {
    const body = (await request.json()) as { variables?: { email?: string; password?: string } } | null;
    if (!body?.variables) {
      return HttpResponse.json(
        {
          errors: [
            {
              message: 'Invalid request body',
              extensions: { code: 'BAD_USER_INPUT' },
            },
          ],
        },
        { status: 400 }
      );
    }

    const { email, password } = body.variables;
    if (email === 'test@example.com' && password === 'password123') {
      return HttpResponse.json({ data: { login: 'mock-jwt-token-12345' } });
    }

    return HttpResponse.json(
      {
        errors: [
          {
            message: 'Invalid email or password',
            extensions: { code: 'UNAUTHENTICATED' },
          },
        ],
      },
      { status: 401 }
    );
  }),

  graphql.mutation('Register', async ({ request }) => {
    const body = (await request.json()) as { variables?: { email?: string; password?: string; name?: string } } | null;
    if (!body?.variables) {
      return HttpResponse.json(
        {
          errors: [
            {
              message: 'Invalid request body',
              extensions: { code: 'BAD_USER_INPUT' },
            },
          ],
        },
        { status: 400 }
      );
    }

    const { email } = body.variables;
    if (email === 'exists@example.com') {
      return HttpResponse.json(
        {
          errors: [
            {
              message: 'Email already exists',
              extensions: { code: 'BAD_USER_INPUT' },
            },
          ],
        },
        { status: 400 }
      );
    }

    return HttpResponse.json({ data: { register: 'mock-jwt-token-new-user' } });
  }),

  graphql.mutation('ChangePassword', async ({ request }) => {
    const body = (await request.json()) as { variables?: { currentPassword?: string; newPassword?: string } } | null;
    if (!body?.variables) {
      return HttpResponse.json(
        {
          errors: [
            {
              message: 'Invalid request body',
              extensions: { code: 'BAD_USER_INPUT' },
            },
          ],
        },
        { status: 400 }
      );
    }

    const { currentPassword } = body.variables;
    if (currentPassword === 'wrong-password') {
      return HttpResponse.json(
        {
          errors: [
            {
              message: 'Current password is incorrect',
              extensions: { code: 'UNAUTHENTICATED' },
            },
          ],
        },
        { status: 401 }
      );
    }

    return HttpResponse.json({ data: { changePassword: true } });
  }),

  graphql.mutation('ForgotPassword', async ({ request }) => {
    const body = (await request.json()) as { variables?: { email?: string } } | null;
    if (!body?.variables) {
      return HttpResponse.json(
        {
          errors: [
            {
              message: 'Invalid request body',
              extensions: { code: 'BAD_USER_INPUT' },
            },
          ],
        },
        { status: 400 }
      );
    }

    const { email } = body.variables;
    if (email === 'notfound@example.com') {
      return HttpResponse.json(
        {
          errors: [
            {
              message: 'No account found with this email address',
              extensions: { code: 'NOT_FOUND' },
            },
          ],
        },
        { status: 404 }
      );
    }

    return HttpResponse.json({ data: { forgotPassword: true } });
  }),
];

