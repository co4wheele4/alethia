import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '../../../hooks/useTheme';
import { EvidenceSnippet } from '../components/EvidenceSnippet';

const TestWrapper = ({ children }: { children: React.ReactNode }) => <ThemeProvider>{children}</ThemeProvider>;

describe('EvidenceSnippet', () => {
  it('renders a snippet from evidence offsets when valid', () => {
    render(
      <TestWrapper>
        <EvidenceSnippet
          evidence={{
            __typename: 'EntityRelationshipEvidence',
            id: 'ev-1',
            kind: 'TEXT_SPAN',
            createdAt: '2026-01-01T00:00:00Z',
            chunkId: 'c1',
            startOffset: 6,
            endOffset: 11,
            quotedText: null,
            chunk: {
              __typename: 'DocumentChunk',
              id: 'c1',
              chunkIndex: 0,
              content: 'hello world',
              documentId: 'd1',
              document: { __typename: 'Document', id: 'd1', title: 'Doc', createdAt: '2026-01-01T00:00:00Z' },
            },
            mentionLinks: [],
          }}
        />
      </TestWrapper>
    );

    expect(screen.getByText(/Evidence ID:\s*ev-1/i)).toBeInTheDocument();
    expect(screen.getByText(/world/i)).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('warns and falls back to raw chunk text when evidence offsets are invalid', () => {
    render(
      <TestWrapper>
        <EvidenceSnippet
          evidence={{
            __typename: 'EntityRelationshipEvidence',
            id: 'ev-bad',
            kind: 'TEXT_SPAN',
            createdAt: '2026-01-01T00:00:00Z',
            chunkId: 'c1',
            startOffset: 0,
            endOffset: 999,
            quotedText: null,
            chunk: {
              __typename: 'DocumentChunk',
              id: 'c1',
              chunkIndex: 0,
              content: 'hello',
              documentId: 'd1',
              document: { __typename: 'Document', id: 'd1', title: 'Doc', createdAt: '2026-01-01T00:00:00Z' },
            },
            mentionLinks: [],
          }}
        />
      </TestWrapper>
    );

    expect(screen.getByRole('alert')).toHaveTextContent(/offsets could not be applied/i);
    expect(screen.getByText('hello')).toBeInTheDocument();
  });
});

