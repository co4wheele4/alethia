import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EvidencePanel } from '../components/EvidencePanel'
import { useDocuments, type DocumentListItem } from '../../documents/hooks/useDocuments'
import type { DocumentChunkItem, DocumentHeader } from '../../documents/hooks/useDocumentChunks'
import { ThemeProvider } from '../../../hooks/useTheme'
import { vi } from 'vitest'
import type { ReactNode } from 'react'

// MUI list primitives are expensive to render under coverage load on Windows.
// For this file only, swap the frequently-rendered primitives with lightweight equivalents
// that preserve accessible text/roles used by the component and tests.
vi.mock('@mui/material', async () => {
  const actual = await vi.importActual<typeof import('@mui/material')>('@mui/material')

  type BoxProps = { children?: ReactNode; component?: string; onClick?: () => void; sx?: unknown }
  type TypographyProps = { children?: ReactNode; component?: string; sx?: unknown }
  type ListProps = { children?: ReactNode; 'aria-label'?: string; dense?: boolean }
  type ListItemButtonProps = { children?: ReactNode; onClick?: () => void; selected?: boolean }
  type ListItemIconProps = { children?: ReactNode }
  type ListItemTextProps = { primary?: ReactNode; secondary?: ReactNode; secondaryTypographyProps?: unknown }
  type ButtonProps = { children?: ReactNode; onClick?: () => void; type?: string }
  type CheckboxProps = { checked?: boolean; inputProps?: { 'aria-label'?: string }; onChange?: () => void }
  type TextFieldProps = { label?: string; value?: string; onChange?: (e: { target: { value: string } }) => void }
  type AlertProps = { children?: ReactNode; severity?: string }

  return {
    ...actual,
    Box: (props: BoxProps) => {
      // Avoid dynamic JSX element typing issues in TS (keep fast + deterministic).
      return <div onClick={props.onClick}>{props.children}</div>
    },
    Typography: (props: TypographyProps) => {
      return props.component === 'pre' ? <pre>{props.children}</pre> : <div>{props.children}</div>
    },
    Divider: () => <hr />,
    Alert: (props: AlertProps) => <div role="alert">{props.children}</div>,
    CircularProgress: () => <span>spinner</span>,
    List: (props: ListProps) => <ul aria-label={props['aria-label']}>{props.children}</ul>,
    ListItemButton: (props: ListItemButtonProps) => (
      <button aria-pressed={props.selected} onClick={props.onClick}>
        {props.children}
      </button>
    ),
    ListItemIcon: (props: ListItemIconProps) => <span>{props.children}</span>,
    ListItemText: (props: ListItemTextProps) => (
      <span>
        <span>{props.primary}</span>
        {props.secondary ? <span>{props.secondary}</span> : null}
      </span>
    ),
    Button: (props: ButtonProps) => (
      <button type={(props.type as 'button' | 'submit' | 'reset' | undefined) ?? 'button'} onClick={props.onClick}>
        {props.children}
      </button>
    ),
    Checkbox: (props: CheckboxProps) => (
      <input
        type="checkbox"
        aria-label={props.inputProps?.['aria-label']}
        checked={Boolean(props.checked)}
        onChange={props.onChange}
      />
    ),
    TextField: (props: TextFieldProps) => (
      <label>
        {props.label}
        <input aria-label={props.label} value={props.value ?? ''} onChange={props.onChange} />
      </label>
    ),
  }
})

vi.mock('../../documents/hooks/useDocuments')

type HeaderContainerProps = {
  documentId: string | null
  children: (state: { document: DocumentHeader | null; loading: boolean; error: Error | null }) => ReactNode
}

type ChunksContainerProps = {
  documentId: string | null
  children: (state: { chunks: DocumentChunkItem[]; loading: boolean; error: Error | null }) => ReactNode
}

type UseDocumentsResult = ReturnType<typeof useDocuments>

let docsState: UseDocumentsResult
let headerState: { loading: boolean; error: Error | null }
let chunksState: { loading: boolean; error: Error | null }
let chunksByDocId: Record<string, DocumentChunkItem[]>

const MockSelectedDocumentHeaderQueryContainer = vi.fn((props: HeaderContainerProps) => {
  const { children, documentId } = props
  const docFromList = documentId ? docsState.documents.find((d) => d.id === documentId) ?? null : null
  const header: DocumentHeader | null = docFromList
    ? { __typename: 'Document', id: docFromList.id, title: docFromList.title, createdAt: docFromList.createdAt }
    : null
  return children({ document: header, loading: headerState.loading, error: headerState.error })
})

vi.mock('../../documents/components/SelectedDocumentHeaderQueryContainer', () => ({
  SelectedDocumentHeaderQueryContainer: (props: HeaderContainerProps) => MockSelectedDocumentHeaderQueryContainer(props),
}))

const MockSelectedDocumentChunksQueryContainer = vi.fn((props: ChunksContainerProps) => {
  const { children, documentId } = props
  const chunks = (documentId ? chunksByDocId[documentId] : []) ?? []
  return children({ chunks, loading: chunksState.loading, error: chunksState.error })
})

vi.mock('../../documents/components/SelectedDocumentChunksQueryContainer', () => ({
  SelectedDocumentChunksQueryContainer: (props: ChunksContainerProps) => MockSelectedDocumentChunksQueryContainer(props),
}))

const TestWrapper = ({ children }: { children: ReactNode }) => <ThemeProvider>{children}</ThemeProvider>

const mockedUseDocuments = vi.mocked(useDocuments)

function makeUseDocumentsResult(overrides?: Partial<UseDocumentsResult>): UseDocumentsResult {
  const base: UseDocumentsResult = {
    documents: [],
    loading: false,
    error: null,
    isBusy: false,
    createDocument: vi.fn(async () => null),
    deleteDocument: vi.fn(async (id: string) => id),
    refetch: async () => ({} as unknown as Awaited<ReturnType<UseDocumentsResult['refetch']>>),
  }
  return { ...base, ...overrides }
}

function makeDoc(id: string, title: string): DocumentListItem {
  return { __typename: 'Document', id, title, createdAt: '2023-01-01T12:00:00Z' }
}

function makeChunk(idx: number, content: string): DocumentChunkItem {
  return {
    __typename: 'DocumentChunk',
    id: `c${idx}`,
    chunkIndex: idx,
    content,
    mentions: [],
    aiSuggestions: [],
  }
}

describe('EvidencePanel', () => {
  beforeEach(() => {
    // Some tests elsewhere may enable fake timers; userEvent needs real timers unless configured.
    vi.useRealTimers()

    docsState = makeUseDocumentsResult({ documents: [makeDoc('d1', 'Doc One')] })
    headerState = { loading: false, error: null }
    chunksState = { loading: false, error: null }
    const chunk0 = makeChunk(0, 'Chunk 0 content')
    const chunk0WithoutMentions = { ...chunk0, mentions: undefined } as unknown as DocumentChunkItem
    const chunk1 = makeChunk(1, 'Chunk 1 content')
    chunk1.mentions = [
      {
        __typename: 'EntityMention',
        id: 'm1',
        entityId: 'e1',
        chunkId: 'c1',
        entity: { __typename: 'Entity', id: 'e1', name: 'Entity One', type: 'Person' },
      },
    ]
    chunksByDocId = {
      d1: [chunk0WithoutMentions, chunk1],
    }
    mockedUseDocuments.mockImplementation(() => docsState)
    MockSelectedDocumentHeaderQueryContainer.mockClear()
    MockSelectedDocumentChunksQueryContainer.mockClear()
  })

  it('renders info when not logged in', () => {
    render(
      <TestWrapper>
        <EvidencePanel userId={null} />
      </TestWrapper>
    )
    expect(screen.getByText(/Evidence inspection is available after login/i)).toBeInTheDocument()
  })

  it('renders loading and error states for documents and chunks', () => {
    docsState = makeUseDocumentsResult({ documents: [], loading: true, error: new Error('Docs load failed') })
    chunksState = { loading: true, error: new Error('Chunks load failed') }

    render(
      <TestWrapper>
        <EvidencePanel userId="u1" />
      </TestWrapper>
    )

    expect(screen.getByText(/Docs load failed/i)).toBeInTheDocument()
    expect(screen.getByText(/Loading documents…/i)).toBeInTheDocument()
    expect(screen.getByText(/Chunks load failed/i)).toBeInTheDocument()
    expect(screen.getByText(/Loading chunks…/i)).toBeInTheDocument()
  })

  it('renders correctly and handles interactions (focus, compare, search)', async () => {
    const user = userEvent.setup()
    render(
      <TestWrapper>
        <EvidencePanel userId="u1" />
      </TestWrapper>
    )

    expect(screen.getByText('Doc One')).toBeInTheDocument()
    expect(screen.getByText(/Chunk 0$/)).toBeInTheDocument()
    expect(screen.getByText(/0 mentions/i)).toBeInTheDocument()
    expect(screen.getByText(/1 mentions/i)).toBeInTheDocument()

    // Focus chunk 0
    await user.click(screen.getByText('Chunk 0'))
    expect(screen.getAllByText('Chunk 0 content').length).toBeGreaterThan(0)

    // Select chunk 0 for compare
    const checkbox0 = screen.getByLabelText(/select chunk 0 for comparison/i)
    await user.click(checkbox0)
    const clearSelection = screen.getByRole('button', { name: /Clear comparison selection/i })
    expect(clearSelection).toBeInTheDocument()

    // Clear selection explicitly (covers onClick branch)
    await user.click(clearSelection)
    expect(screen.queryByRole('button', { name: /Clear comparison selection/i })).not.toBeInTheDocument()

    // Re-select for comparison
    await user.click(checkbox0)
    expect(screen.getByRole('button', { name: /Clear comparison selection/i })).toBeInTheDocument()

    // Select chunk 1 for compare -> side-by-side view
    const checkbox1 = screen.getByLabelText(/select chunk 1 for comparison/i)
    await user.click(checkbox1)
    expect(screen.getByText(/Side-by-side comparison/i)).toBeInTheDocument()
    expect(screen.getAllByText('Chunk 0 content').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Chunk 1 content').length).toBeGreaterThan(0)

    // Deselect both -> no comparison
    await user.click(checkbox0)
    await user.click(checkbox1)
    expect(screen.queryByText(/Side-by-side comparison/i)).not.toBeInTheDocument()

    // Search filter hides chunk rows (filtered list)
    const searchInput = screen.getByLabelText(/Search within chunks/i)
    await user.clear(searchInput)
    await user.type(searchInput, 'none')
    expect(screen.queryByText(/Chunk 0$/)).not.toBeInTheDocument()

    await user.clear(searchInput)
    await user.type(searchInput, 'chunk 0')
    expect(screen.getByText(/Chunk 0$/)).toBeInTheDocument()
  })

  it('handles document selection and load more documents', async () => {
    const user = userEvent.setup()
    docsState = makeUseDocumentsResult({ documents: [makeDoc('d1', 'Doc One'), makeDoc('d2', 'Doc Two')] })
    chunksByDocId = {
      d1: [makeChunk(0, 'Chunk 0 content')],
      d2: [makeChunk(0, 'Chunk 0 content (doc2)')],
    }

    render(
      <TestWrapper>
        <EvidencePanel userId="u1" />
      </TestWrapper>
    )

    await user.click(screen.getByText('Doc Two'))
    expect(MockSelectedDocumentHeaderQueryContainer).toHaveBeenCalled()
    expect(MockSelectedDocumentChunksQueryContainer).toHaveBeenCalled()
    expect(screen.getByText('Doc Two')).toBeInTheDocument()
  })

  it('handles load more documents', async () => {
    const user = userEvent.setup()
    docsState = makeUseDocumentsResult({ documents: Array.from({ length: 30 }, (_, i) => makeDoc(`d${i}`, `Doc ${i}`)) })

    render(
      <TestWrapper>
        <EvidencePanel userId="u1" />
      </TestWrapper>
    )

    const loadMore = screen.getByRole('button', { name: /Load more documents/i })
    await user.click(loadMore)
    expect(screen.getByText('Doc 25')).toBeInTheDocument()
  })

  it('handles load more chunks', async () => {
    chunksByDocId = {
      // Minimal >60 to exercise "Load more chunks" control deterministically.
      d1: Array.from({ length: 61 }, (_, i) => makeChunk(i, `Chunk ${i} content`)),
    }

    // Render without ThemeProvider for speed (logic does not depend on theme).
    render(<EvidencePanel userId="u1" />)

    expect(screen.queryByText(/Chunk 60$/)).not.toBeInTheDocument()
    const loadMore = screen.getByRole('button', { name: /Load more chunks/i })
    // Use a low-level click here to avoid userEvent timing flakiness under heavy coverage runs.
    fireEvent.click(loadMore)
    expect(screen.getByText(/Chunk 60$/)).toBeInTheDocument()
  })

  it('renders info when no chunks', () => {
    chunksByDocId = { d1: [] }
    render(
      <TestWrapper>
        <EvidencePanel userId="u1" />
      </TestWrapper>
    )
    expect(screen.getByText(/No chunks available for this document/i)).toBeInTheDocument()
  })

  it('covers "not found" focused chunk + compare chunk fallbacks (lines 136-143)', async () => {
    const user = userEvent.setup()
    const { rerender } = render(
      <TestWrapper>
        <EvidencePanel userId="u1" />
      </TestWrapper>
    )

    // Focus chunk 1 and select chunks 0 + 1 for comparison.
    await user.click(screen.getByText('Chunk 1'))
    await user.click(screen.getByLabelText(/select chunk 1 for comparison/i))
    await user.click(screen.getByLabelText(/select chunk 0 for comparison/i))
    expect(screen.getByText(/Side-by-side comparison/i)).toBeInTheDocument()
    // Ensure focus is on the soon-to-be-missing chunk index (checkbox clicks can bubble focus).
    await user.click(screen.getByText('Chunk 1'))

    // Now swap the backing chunks so chunkIndex=1 no longer exists.
    // This preserves internal state (focusedChunkIndex and selectedForCompare) but forces `find(...) ?? null`.
    chunksByDocId = { d1: [makeChunk(0, 'Chunk 0 content')] }
    rerender(
      <TestWrapper>
        <EvidencePanel userId="u1" />
      </TestWrapper>
    )

    // Focused chunk is now "missing" -> falls back to the instructional text.
    expect(
      screen.getByText((t) => t.replace(/\s+/g, ' ').includes('Select a chunk to inspect its full content.'))
    ).toBeInTheDocument()

    // Comparison still renders (left exists, right missing) and shows placeholder chunk index.
    expect(screen.getByText(/Side-by-side comparison/i)).toBeInTheDocument()
    // Selection order is [1,0] so A is missing, B is present.
    expect(screen.getByText(/A\s*•\s*Chunk\s*—/i)).toBeInTheDocument()
  })

  it('covers "not found" right compare chunk fallback (line 143)', async () => {
    const user = userEvent.setup()
    const { rerender } = render(
      <TestWrapper>
        <EvidencePanel userId="u1" />
      </TestWrapper>
    )

    // Select in order [0,1] so `b` is the missing one after rerender.
    await user.click(screen.getByText('Chunk 1'))
    await user.click(screen.getByLabelText(/select chunk 0 for comparison/i))
    await user.click(screen.getByLabelText(/select chunk 1 for comparison/i))
    expect(screen.getByText(/Side-by-side comparison/i)).toBeInTheDocument()

    // Ensure focus is on chunk 1 (checkbox clicks can bubble focus).
    await user.click(screen.getByText('Chunk 1'))

    // Remove chunkIndex=1 from the backing data.
    chunksByDocId = { d1: [makeChunk(0, 'Chunk 0 content')] }
    rerender(
      <TestWrapper>
        <EvidencePanel userId="u1" />
      </TestWrapper>
    )

    expect(screen.getByText(/Side-by-side comparison/i)).toBeInTheDocument()
    expect(screen.getByText(/B\s*•\s*Chunk\s*—/i)).toBeInTheDocument()
  })
})
