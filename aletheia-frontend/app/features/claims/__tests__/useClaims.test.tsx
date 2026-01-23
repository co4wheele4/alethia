import { renderHook, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing/react';

import { CLAIMS_BY_DOCUMENT_QUERY, LIST_CLAIMS_QUERY } from '../graphql';
import { assertClaimsGrounded, useClaims } from '../hooks/useClaims';

const docCore = {
  __typename: 'Document' as const,
  id: 'doc_1',
  title: 'Doc 1',
  createdAt: '2026-01-01T00:00:00.000Z',
  sourceType: 'URL',
  sourceLabel: 'example',
  source: {
    __typename: 'DocumentSource' as const,
    id: 'src_1',
    documentId: 'doc_1',
    kind: 'URL',
    ingestedAt: null,
    accessedAt: null,
    publishedAt: null,
    author: null,
    publisher: null,
    filename: null,
    mimeType: null,
    contentType: null,
    sizeBytes: null,
    requestedUrl: null,
    fetchedUrl: null,
    contentSha256: null,
    fileSha256: null,
    lastModifiedMs: null,
  },
};

const claim1 = {
  __typename: 'Claim' as const,
  id: 'c1',
  text: 'Claim text',
  status: 'DRAFT' as const,
  createdAt: '2026-01-02T00:00:00.000Z',
  evidence: [
    {
      __typename: 'ClaimEvidence' as const,
      id: 'ev1',
      claimId: 'c1',
      documentId: 'doc_1',
      createdAt: '2026-01-02T00:00:00.000Z',
      mentionIds: ['m1'],
      relationshipIds: [],
    },
  ],
  documents: [docCore],
};

describe('useClaims', () => {
  it('lists workspace claims', async () => {
    const mocks = [
      {
        request: { query: LIST_CLAIMS_QUERY },
        result: { data: { claims: [claim1] } },
      },
    ];

    const { result } = renderHook(() => useClaims(null), {
      wrapper: ({ children }) => <MockedProvider mocks={mocks}>{children}</MockedProvider>,
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.claims).toHaveLength(1);
    expect(result.current.claims[0].id).toBe('c1');
  });

  it('lists claims by document', async () => {
    const mocks = [
      {
        request: { query: CLAIMS_BY_DOCUMENT_QUERY, variables: { documentId: 'doc_1' } },
        result: { data: { claimsByDocument: [claim1] } },
      },
    ];

    const { result } = renderHook(() => useClaims('doc_1'), {
      wrapper: ({ children }) => <MockedProvider mocks={mocks}>{children}</MockedProvider>,
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.claims).toHaveLength(1);
    expect(result.current.claims[0].documents[0].id).toBe('doc_1');
  });

  it('fails fast when a claim has empty evidence[]', () => {
    expect(() => assertClaimsGrounded([{ ...claim1, evidence: [] } as any])).toThrow(/evidence\[\]/i);
  });
});

