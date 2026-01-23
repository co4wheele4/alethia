/**
 * Deterministic MSW fixtures for the trust UI phase.
 *
 * These are intentionally small but contract-complete:
 * - provenance is present (sourceType/sourceLabel/source)
 * - mentions include offsets
 * - relationships include evidence anchors and mentionLinks
 */

export type ISODateTimeString = string;

export const FIXTURE_NOW: ISODateTimeString = '2026-01-21T12:00:00.000Z';

export const fixture = {
  documents: [
    {
      __typename: 'Document',
      id: 'doc_1',
      title: 'Example: Public article snapshot',
      createdAt: '2026-01-20T10:15:00.000Z',
      sourceType: 'URL',
      sourceLabel: 'example.com / public-article',
      source: {
        __typename: 'DocumentSource',
        id: 'src_1',
        documentId: 'doc_1',
        kind: 'URL',
        ingestedAt: '2026-01-20T10:15:10.000Z',
        accessedAt: '2026-01-20T10:15:05.000Z',
        publishedAt: '2025-12-01T00:00:00.000Z',
        author: 'Example Author',
        publisher: 'Example Publisher',
        filename: null,
        mimeType: 'text/html',
        contentType: 'text/html',
        sizeBytes: 12345,
        requestedUrl: 'https://example.com/public-article',
        fetchedUrl: 'https://example.com/public-article?utm_source=aletheia',
        contentSha256: 'content_sha_1',
        fileSha256: null,
        lastModifiedMs: '1733078400000',
      },
      chunks: [
        {
          __typename: 'DocumentChunk',
          id: 'chunk_1_0',
          chunkIndex: 0,
          content:
            'Aletheia is a truth-discovery system. Example Publisher states that Aletheia prioritizes provenance.',
          documentId: 'doc_1',
          mentions: [
            {
              __typename: 'EntityMention',
              id: 'm_1',
              entityId: 'e_1',
              chunkId: 'chunk_1_0',
              startOffset: 0,
              endOffset: 8,
              excerpt: 'Aletheia',
              entity: {
                __typename: 'Entity',
                id: 'e_1',
                name: 'Aletheia',
                type: 'System',
                mentionCount: 2,
              },
            },
            {
              __typename: 'EntityMention',
              id: 'm_2',
              entityId: 'e_2',
              chunkId: 'chunk_1_0',
              startOffset: 40,
              endOffset: 57,
              excerpt: 'Example Publisher',
              entity: {
                __typename: 'Entity',
                id: 'e_2',
                name: 'Example Publisher',
                type: 'Organization',
                mentionCount: 1,
              },
            },
          ],
        },
      ],
    },
    {
      __typename: 'Document',
      id: 'doc_2',
      title: 'Example: Local file snapshot',
      createdAt: '2026-01-18T08:00:00.000Z',
      sourceType: 'FILE',
      sourceLabel: 'local://notes.txt',
      source: {
        __typename: 'DocumentSource',
        id: 'src_2',
        documentId: 'doc_2',
        kind: 'FILE',
        ingestedAt: '2026-01-18T08:00:12.000Z',
        accessedAt: null,
        publishedAt: null,
        author: null,
        publisher: null,
        filename: 'notes.txt',
        mimeType: 'text/plain',
        contentType: 'text/plain',
        sizeBytes: 321,
        requestedUrl: null,
        fetchedUrl: null,
        contentSha256: 'content_sha_2',
        fileSha256: 'file_sha_2',
        lastModifiedMs: '1737168000000',
      },
      chunks: [
        {
          __typename: 'DocumentChunk',
          id: 'chunk_2_0',
          chunkIndex: 0,
          content: 'Notes mention Aletheia again.',
          documentId: 'doc_2',
          mentions: [
            {
              __typename: 'EntityMention',
              id: 'm_3',
              entityId: 'e_1',
              chunkId: 'chunk_2_0',
              startOffset: 14,
              endOffset: 21,
              excerpt: 'Aletheia',
              entity: {
                __typename: 'Entity',
                id: 'e_1',
                name: 'Aletheia',
                type: 'System',
                mentionCount: 2,
              },
            },
          ],
        },
      ],
    },
  ],
  entities: [
    {
      __typename: 'Entity',
      id: 'e_1',
      name: 'Aletheia',
      type: 'System',
      mentionCount: 2,
    },
    {
      __typename: 'Entity',
      id: 'e_2',
      name: 'Example Publisher',
      type: 'Organization',
      mentionCount: 1,
    },
  ],
  relationships: [
    {
      __typename: 'EntityRelationship',
      id: 'r_1',
      relation: 'prioritizes',
      from: {
        __typename: 'Entity',
        id: 'e_1',
        name: 'Aletheia',
        type: 'System',
        mentionCount: 2,
      },
      to: {
        __typename: 'Entity',
        id: 'e_3',
        name: 'provenance',
        type: 'Concept',
        mentionCount: 1,
      },
      evidence: [
        {
          __typename: 'EntityRelationshipEvidence',
          id: 'ev_1',
          kind: 'TEXT_SPAN',
          createdAt: FIXTURE_NOW,
          relationshipId: 'r_1',
          chunkId: 'chunk_1_0',
          startOffset: 70,
          endOffset: 100,
          quotedText: 'Aletheia prioritizes provenance',
          chunk: {
            __typename: 'DocumentChunk',
            id: 'chunk_1_0',
            chunkIndex: 0,
            content:
              'Aletheia is a truth-discovery system. Example Publisher states that Aletheia prioritizes provenance.',
            documentId: 'doc_1',
            document: null as unknown, // filled by handler to avoid duplication
          },
          mentionLinks: [
            {
              __typename: 'EntityRelationshipEvidenceMention',
              evidenceId: 'ev_1',
              mentionId: 'm_1',
              mention: null as unknown, // filled by handler
            },
          ],
        },
      ],
    },
  ],
  claims: [
    {
      __typename: 'Claim',
      id: 'claim_1',
      text: 'Example Publisher states that Aletheia prioritizes provenance.',
      status: 'DRAFT',
      createdAt: FIXTURE_NOW,
      evidence: [
        {
          __typename: 'ClaimEvidence',
          id: 'cev_1',
          claimId: 'claim_1',
          documentId: 'doc_1',
          createdAt: FIXTURE_NOW,
          mentionIds: ['m_1'],
          relationshipIds: ['r_1'],
        },
      ],
    },
    {
      __typename: 'Claim',
      id: 'claim_2',
      text: 'Notes mention Aletheia again.',
      status: 'REVIEWED',
      createdAt: FIXTURE_NOW,
      evidence: [
        {
          __typename: 'ClaimEvidence',
          id: 'cev_2',
          claimId: 'claim_2',
          documentId: 'doc_2',
          createdAt: FIXTURE_NOW,
          mentionIds: ['m_3'],
          relationshipIds: [],
        },
      ],
    },
  ],
} as const;

