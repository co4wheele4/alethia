import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react';
import { EvidenceExplorer } from '../components/EvidenceExplorer';
import { useDocuments } from '../../documents/hooks/useDocuments';
import { useEntities } from '../../entities/hooks/useEntities';
import { useEntity } from '../../entities/hooks/useEntity';
import { useChunksByDocument } from '../../documents/hooks/useDocumentChunks';
import { ThemeProvider } from '../../../hooks/useTheme';
import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { vi } from 'vitest';

vi.mock('../../documents/hooks/useDocuments');
vi.mock('../../entities/hooks/useEntities');
vi.mock('../../entities/hooks/useEntity');
vi.mock('../../documents/hooks/useDocumentChunks');

const mockDocs = [
  { id: 'd1', title: 'Doc One', createdAt: '2023-01-01T12:00:00Z', __typename: 'Document' },
  { id: 'd2', title: 'Doc Two', createdAt: '2023-01-02T12:00:00Z', __typename: 'Document' },
  ...Array.from({ length: 30 }, (_, i) => ({
    id: `extra-doc-${i}`,
    title: `Extra Doc ${i}`,
    createdAt: '2023-01-03T12:00:00Z',
    __typename: 'Document'
  })),
];

const mockEntities = [
  { id: 'e1', name: 'Entity One', type: 'Person', mentionCount: 1, __typename: 'Entity' },
  { id: 'e2', name: 'Entity Two', type: 'Org', mentionCount: 2, __typename: 'Entity' },
];

const mockEntityDetail = {
  id: 'e1',
  name: 'Entity One',
  type: 'Person',
  mentionCount: 1,
  mentions: [
    {
      id: 'm1',
      startOffset: 0,
      endOffset: 5,
      chunk: {
        id: 'c1',
        chunkIndex: 0,
        content: 'Hello world',
        document: { id: 'd1', title: 'Doc One' },
      },
      __typename: 'EntityMention'
    },
    {
      id: 'm2',
      startOffset: null,
      endOffset: null,
      chunk: {
        id: 'c1',
        chunkIndex: 0,
        content: 'Long text '.repeat(50),
        document: { id: 'd1', title: 'Doc One' },
      },
      __typename: 'EntityMention'
    },
  ],
  outgoing: [
    {
      id: 'rel1',
      relation: 'WORKS_AT',
      to: { id: 'e2', name: 'ACME' },
      evidence: [
        {
          id: 'ev1',
          createdAt: '2023-01-01T12:00:00Z',
          startOffset: 0,
          endOffset: 10,
          chunk: {
            id: 'c1',
            chunkIndex: 0,
            content: 'ACME content',
            document: { id: 'd1', title: 'Doc One' },
          },
          __typename: 'RelationshipEvidence'
        },
      ],
      __typename: 'EntityRelationship'
    },
  ],
  incoming: [
    {
      id: 'rel2',
      relation: 'HIRED_BY',
      from: { id: 'e2', name: 'ACME' },
      evidence: [],
      __typename: 'EntityRelationship'
    }
  ],
  __typename: 'Entity'
};

const mockChunks = [
  { id: 'c1', chunkIndex: 0, content: 'Hello world', mentions: [{ id: 'm1' }], aiSuggestions: [], __typename: 'DocumentChunk' },
];

const client = new ApolloClient({
  cache: new InMemoryCache(),
  link: new HttpLink({ uri: '/graphql', fetch: vi.fn() }), 
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    <ApolloProvider client={client}>
      {children}
    </ApolloProvider>
  </ThemeProvider>
);

describe('EvidenceExplorer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    client.clearStore();
    
    (useDocuments as any).mockReturnValue({ documents: mockDocs, loading: false, error: null });
    (useEntities as any).mockReturnValue({ entities: mockEntities, loading: false, error: null });
    (useEntity as any).mockReturnValue({ entity: mockEntityDetail, loading: false, error: null });
    (useChunksByDocument as any).mockReturnValue({ chunks: mockChunks, loading: false, error: null });
  });

  it('renders correctly and handles basic filters', async () => {
    await act(async () => {
      render(
        <TestWrapper>
          <EvidenceExplorer userId="u1" />
        </TestWrapper>
      );
    });

    expect(screen.getByText('Doc One')).toBeInTheDocument();
    
    // Filter documents
    const docInput = screen.getByLabelText(/Filter documents/i);
    await act(async () => {
      fireEvent.change(docInput, { target: { value: 'Two' } });
    });
    expect(screen.queryByText('Doc One')).not.toBeInTheDocument();
    expect(screen.getByText('Doc Two')).toBeInTheDocument();
    await act(async () => {
      fireEvent.change(docInput, { target: { value: '' } });
    });

    // Filter entities
    const entityInput = screen.getByLabelText(/Filter entities/i);
    await act(async () => {
      fireEvent.change(entityInput, { target: { value: 'Two' } });
    });
    
    // Check that Entity One is gone FROM THE LIST
    const entityList = screen.getByLabelText('explorer-entities');
    expect(within(entityList).queryByText('Entity One')).not.toBeInTheDocument();
    expect(within(entityList).getByText('Entity Two')).toBeInTheDocument();
  });

  it('handles drill-down interactions', async () => {
    await act(async () => {
      render(
        <TestWrapper>
          <EvidenceExplorer userId="u1" />
        </TestWrapper>
      );
    });

    // 1. Click Doc One
    await act(async () => {
      fireEvent.click(screen.getByText('Doc One'));
    });
    
    // 2. Click Chunk 0
    const chunkList = screen.getByLabelText('explorer-chunks');
    const chunkBtn = await within(chunkList).findByText(/Chunk 0/i);
    await act(async () => {
      fireEvent.click(chunkBtn);
    });
    
    // Check Evidence Panel
    expect(await screen.findByText(/Document chunk 0/i)).toBeInTheDocument();

    // 3. Click Entity One
    const entityList = screen.getByLabelText('explorer-entities');
    await act(async () => {
      fireEvent.click(within(entityList).getByText('Entity One'));
    });

    // 4. Click Relationship WORKS_AT (outgoing)
    const outgoingRelList = await screen.findByLabelText('explorer-rel-outgoing');
    const worksAtBtn = within(outgoingRelList).getByText(/WORKS_AT/i);
    await act(async () => {
      fireEvent.click(worksAtBtn);
    });
    
    // 5. Click Relationship Evidence
    const relEvidenceList = await screen.findByLabelText('explorer-relationship-evidence');
    const evidenceBtn = within(relEvidenceList).getByText(/Doc One • chunk 0/i);
    await act(async () => {
      fireEvent.click(evidenceBtn);
    });
    expect(await screen.findByText(/Relationship evidence \(WORKS_AT\)/i)).toBeInTheDocument();

    // 6. Click Mention
    const mentionList = screen.getByLabelText('explorer-entity-mentions');
    const mentions = within(mentionList).getAllByText(/Doc One • chunk 0/i);
    await act(async () => {
      fireEvent.click(mentions[0]);
    });
    expect(await screen.findByText(/Mention in chunk 0/i)).toBeInTheDocument();
  });

  it('renders "no evidence anchors" for relationships with no evidence', async () => {
    // Mock useEntity to return an entity with a relationship that has no evidence
    (useEntity as any).mockReturnValue({
      entity: {
        ...mockEntityDetail,
        incoming: [
          {
            id: 'rel-no-ev',
            relation: 'NONE',
            from: { id: 'e2', name: 'ACME' },
            evidence: [],
            __typename: 'EntityRelationship'
          }
        ]
      },
      loading: false,
      error: null
    });

    await act(async () => {
      render(
        <TestWrapper>
          <EvidenceExplorer userId="u1" />
        </TestWrapper>
      );
    });

    // Click Entity One (which now has the relationship)
    const entityList = screen.getByLabelText('explorer-entities');
    const entityBtn = within(entityList).getByText('Entity One');
    await act(async () => {
      fireEvent.click(entityBtn);
    });

    // Click the relationship
    const relBtn = await screen.findByText(/ACME → NONE/i);
    await act(async () => {
      fireEvent.click(relBtn);
    });

    await waitFor(() => {
      const alerts = screen.getAllByRole('alert');
      const hasNoEv = alerts.some(a => a.textContent?.includes('This relationship has no evidence anchors'));
      expect(hasNoEv).toBe(true);
    });
  });

  it('handles provenanceConfirmed: false in source badge', async () => {
    vi.spyOn(client, 'query').mockResolvedValue({
      data: {
        chunk0ByDocument: {
          __typename: 'DocumentChunk',
          id: 'c1',
          chunkIndex: 0,
          content: '---\nsource:\n  kind: file\n  provenanceConfirmed: false\n---\nHello',
          documentId: 'd1',
          document: { id: 'd1', title: 'Doc One', createdAt: '2023-01-01T12:00:00Z', __typename: 'Document' }
        }
      }
    } as any);

    await act(async () => {
      render(
        <TestWrapper>
          <EvidenceExplorer userId="u1" />
        </TestWrapper>
      );
    });

    // Click through to evidence panel
    await act(async () => {
      fireEvent.click(screen.getByText('Doc One'));
    });
    const chunkList = screen.getByLabelText('explorer-chunks');
    const chunkBtn = await within(chunkList).findByText(/Chunk 0/i);
    await act(async () => {
      fireEvent.click(chunkBtn);
    });

    // Now check the badge in the evidence panel
    const evidenceHeader = await screen.findByText('Evidence');
    const evidenceSurface = evidenceHeader.closest('.MuiBox-root'); 
    
    await waitFor(() => {
      expect(within(evidenceSurface as HTMLElement).getByText(/Confirmed: false/i)).toBeInTheDocument();
    });
  });

  it('handles load more documents', async () => {
    await act(async () => {
      render(
        <TestWrapper>
          <EvidenceExplorer userId="u1" />
        </TestWrapper>
      );
    });

    const loadMore = screen.getByText('Load more');
    await act(async () => {
      fireEvent.click(loadMore);
    });
    expect(screen.getByText('Extra Doc 25')).toBeInTheDocument();
  });

  it('renders errors and loading states', async () => {
    (useDocuments as any).mockReturnValue({ documents: [], loading: true, error: null });
    await act(async () => {
      render(
        <TestWrapper>
          <EvidenceExplorer userId="u1" />
        </TestWrapper>
      );
    });
    expect(screen.getByText(/Loading…/i)).toBeInTheDocument();

    (useDocuments as any).mockReturnValue({ documents: [], loading: false, error: new Error('Docs Failed') });
    await act(async () => {
      render(
        <TestWrapper>
          <EvidenceExplorer userId="u1" />
        </TestWrapper>
      );
    });
    expect(screen.getByText('Docs Failed')).toBeInTheDocument();
  });

  it('renders info when no entity selected or not logged in', async () => {
    (useEntity as any).mockReturnValue({ entity: null, loading: false, error: null });
    await act(async () => {
      render(
        <TestWrapper>
          <EvidenceExplorer userId="u1" />
        </TestWrapper>
      );
    });
    expect(screen.getByText(/No entity selected/i)).toBeInTheDocument();

    await act(async () => {
      render(
        <TestWrapper>
          <EvidenceExplorer userId={null} />
        </TestWrapper>
      );
    });
    expect(screen.getByText(/Evidence exploration is available after login/i)).toBeInTheDocument();
  });

  it('shows badge info and handles prefetch', async () => {
    vi.spyOn(client, 'query').mockResolvedValue({
      data: {
        chunk0ByDocument: {
          __typename: 'DocumentChunk',
          id: 'c1',
          chunkIndex: 0,
          content: '---\nsource:\n  kind: file\n  provenanceType: archive\n  provenanceLabel: Lab\n  provenanceConfirmed: true\n---\nHello',
          documentId: 'd1',
          document: { id: 'd1', title: 'Doc One', createdAt: '2023-01-01T12:00:00Z', __typename: 'Document' }
        }
      }
    } as any);

    await act(async () => {
      render(
        <TestWrapper>
          <EvidenceExplorer userId="u1" />
        </TestWrapper>
      );
    });

    // Wait for prefetch - be more specific to avoid multiple matches from document list
    await waitFor(() => {
      const allMatches = screen.queryAllByText((c) => c.includes('source: file'));
      expect(allMatches.length).toBeGreaterThan(0);
    });

    // Trigger evidence panel badge
    await act(async () => {
      fireEvent.click(screen.getByText('Doc One'));
    });
    const chunkList = screen.getByLabelText('explorer-chunks');
    const chunkBtn = await within(chunkList).findByText(/Chunk 0/i);
    await act(async () => {
      fireEvent.click(chunkBtn);
    });

    const evidenceHeader = await screen.findByText('Evidence');
    const evidenceSurface = evidenceHeader.closest('.MuiBox-root'); 
    
    await waitFor(() => {
      expect(within(evidenceSurface as HTMLElement).getByText(/Source:/i)).toBeInTheDocument();
    });
    expect(within(evidenceSurface as HTMLElement).getByText(/archive/i)).toBeInTheDocument();
  });
});
