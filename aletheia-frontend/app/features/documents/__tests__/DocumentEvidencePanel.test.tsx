import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DocumentEvidencePanel } from '../components/DocumentEvidencePanel'
import { ThemeProvider } from '../../../hooks/useTheme'
import { vi } from 'vitest'
import type { ReactNode } from 'react'
import type { DocumentChunkItem, DocumentHeader } from '../hooks/useDocumentChunks'
import type { DocumentMetadataPanelProps } from '../components/DocumentMetadataPanel'
import type { EntityMentionItem } from '../hooks/useDocumentChunks'

vi.mock('next/link', () => ({
  default: (props: { href: string; children: ReactNode }) => <a href={props.href}>{props.children}</a>,
}))

vi.mock('../components/DocumentMetadataPanel', () => ({
  DocumentMetadataPanel: (props: DocumentMetadataPanelProps) => (
    <div data-testid="metadata-panel">
      Metadata: {props.document?.title ?? '(none)'} • Chunks: {props.chunks.length}
    </div>
  ),
}))

const TestWrapper = ({ children }: { children: ReactNode }) => <ThemeProvider>{children}</ThemeProvider>

const mockDoc: DocumentHeader = { id: 'd1', title: 'Test Doc', createdAt: '2023-01-01T12:00:00Z', __typename: 'Document' }

function mention(id: string, entity: { id: string; name: string; type: string }): EntityMentionItem {
  return {
    __typename: 'EntityMention',
    id,
    entityId: entity.id,
    chunkId: 'chunk-unknown',
    entity: { ...entity, __typename: 'Entity' },
  }
}

function chunk(overrides: Partial<DocumentChunkItem> & Pick<DocumentChunkItem, 'id' | 'chunkIndex' | 'content'>): DocumentChunkItem {
  return {
    __typename: 'DocumentChunk',
    id: overrides.id,
    chunkIndex: overrides.chunkIndex,
    content: overrides.content,
    mentions: overrides.mentions ?? [],
  }
}

const mockChunks: DocumentChunkItem[] = [
  chunk({
    id: 'c1',
    chunkIndex: 0,
    content: 'chunk 0',
    mentions: [mention('m1', { id: 'e1', name: 'E1', type: 'Person' })],
  }),
]

describe('DocumentEvidencePanel', () => {
  it('renders correctly (entities + browse link + selected chunk panel)', async () => {
    const user = userEvent.setup()
    render(
      <TestWrapper>
        <DocumentEvidencePanel
          document={mockDoc}
          chunks={mockChunks}
          selectedChunk={mockChunks[0]}
        />
      </TestWrapper>
    )

    expect(screen.getByTestId('metadata-panel')).toHaveTextContent('Metadata: Test Doc')

    const entitiesList = screen.getByRole('list', { name: 'document-entities' })
    expect(within(entitiesList).getByText('E1')).toBeInTheDocument()
    expect(within(entitiesList).getByText(/Type:\s*Person/i)).toBeInTheDocument()

    const browseAll = screen.getByRole('link', { name: /Browse all entities/i })
    expect(browseAll).toHaveAttribute('href', '/entities')

    // Sanity: link is interactive (Next/Link mocked to <a>)
    await user.click(browseAll)
  })

  it('handles load more entities', async () => {
    const user = userEvent.setup()
    const manyChunks: DocumentChunkItem[] = Array.from({ length: 60 }, (_, i) =>
      chunk({
        id: `c${i}`,
        chunkIndex: i,
        content: `chunk ${i}`,
        mentions: [mention(`m${i}`, { id: `e${i}`, name: `E${i}`, type: 'Person' })],
      })
    )

    render(
      <TestWrapper>
        <DocumentEvidencePanel
          document={mockDoc}
          chunks={manyChunks}
        />
      </TestWrapper>
    )

    const entitiesList = screen.getByRole('list', { name: 'document-entities' })
    expect(within(entitiesList).getByText('E0')).toBeInTheDocument()
    expect(within(entitiesList).queryByText('E55')).not.toBeInTheDocument()

    const loadMoreBtn = screen.getByRole('button', { name: /Load more entities/i })
    await user.click(loadMoreBtn)

    expect(within(entitiesList).getByText('E55')).toBeInTheDocument()
  })

  it('renders empty message when no entities', () => {
    render(
      <TestWrapper>
        <DocumentEvidencePanel
          document={mockDoc}
          chunks={[chunk({ id: 'c1', chunkIndex: 0, content: 'no mentions', mentions: [] })]}
        />
      </TestWrapper>
    )

    expect(screen.getByText(/No entity mentions were returned/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Browse all entities/i })).toHaveAttribute('href', '/entities')
  })

  it('handles entities with missing type', () => {
    render(
      <TestWrapper>
        <DocumentEvidencePanel
          document={mockDoc}
          chunks={[
            chunk({
              id: 'c1',
              chunkIndex: 0,
              content: 'chunk 0',
              mentions: [mention('m1', { id: 'e1', name: 'E1', type: '' })],
            }),
          ]}
        />
      </TestWrapper>
    )

    expect(screen.getByText(/Type:\s*\(missing\)/i)).toBeInTheDocument()
  })

  it('handles chunks with null mentions', () => {
    const chunkWithNullMentions = {
      __typename: 'DocumentChunk',
      id: 'c1',
      chunkIndex: 0,
      content: 'no mentions',
      // Explicitly null at runtime to cover `c.mentions ?? []` in buildEntityIndex.
      mentions: null,
    } as unknown as DocumentChunkItem

    render(
      <TestWrapper>
        <DocumentEvidencePanel
          document={mockDoc}
          chunks={[chunkWithNullMentions]}
        />
      </TestWrapper>
    )

    expect(screen.getByText(/No entity mentions were returned/i)).toBeInTheDocument()
  })

  it('aggregates mentions across chunks, sorts by name, and hides load-more when <= 50', () => {
    const chunks: DocumentChunkItem[] = [
      chunk({
        id: 'c0',
        chunkIndex: 0,
        content: 'c0',
        mentions: [
          mention('m1', { id: 'e-same', name: 'Alpha', type: 'Org' }),
          mention('m2', { id: 'e-z', name: 'Zed', type: 'Person' }),
        ],
      }),
      chunk({
        id: 'c1',
        chunkIndex: 1,
        content: 'c1',
        mentions: [mention('m3', { id: 'e-same', name: 'Alpha', type: 'Org' })],
      }),
      // Cover the `mentions ?? []` fallback with an undefined field.
      chunk({
        id: 'c2',
        chunkIndex: 2,
        content: 'c2',
        mentions: [],
      }),
    ]

    render(
      <TestWrapper>
        <DocumentEvidencePanel document={mockDoc} chunks={chunks} />
      </TestWrapper>
    )

    const entitiesList = screen.getByRole('list', { name: 'document-entities' })
    const names = within(entitiesList).getAllByText(/^(Alpha|Zed)$/).map((n) => n.textContent)
    expect(names).toEqual(['Alpha', 'Zed'])

    // Alpha appears twice across chunks -> mentionCount increments the prev branch.
    expect(within(entitiesList).getByText(/Alpha/).parentElement).not.toBeNull()
    expect(within(entitiesList).getByText(/Mentions:\s*2/i)).toBeInTheDocument()

    // Only two entities -> no "Load more entities" control.
    expect(screen.queryByRole('button', { name: /Load more entities/i })).not.toBeInTheDocument()
  })

})
