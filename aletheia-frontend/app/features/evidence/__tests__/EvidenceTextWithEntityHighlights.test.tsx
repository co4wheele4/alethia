import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EvidenceTextWithEntityHighlights, type HighlightableEntity } from '../components/EvidenceTextWithEntityHighlights'
import { ThemeProvider } from '../../../hooks/useTheme'
import { vi } from 'vitest'
import type { ReactNode } from 'react'

const TestWrapper = ({ children }: { children: ReactNode }) => <ThemeProvider>{children}</ThemeProvider>

const entities: HighlightableEntity[] = [
  { id: 'e1', name: 'John Doe', type: 'Person', mentionCount: 1, confidence: 0.95 },
  { id: 'e2', name: 'ACME Corp', type: 'Organization', mentionCount: 2, confidence: null },
]

describe('EvidenceTextWithEntityHighlights', () => {
  it('renders text with entity highlights', () => {
    render(
      <TestWrapper>
        <EvidenceTextWithEntityHighlights text="John Doe works at ACME Corp." entities={entities} />
      </TestWrapper>
    )

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('ACME Corp')).toBeInTheDocument()
    expect(screen.getByText(/works at/i)).toBeInTheDocument()
  })

  it('handles entity click (calls onEntityClick with id)', async () => {
    const user = userEvent.setup()
    const onEntityClick = vi.fn()
    render(
      <TestWrapper>
        <EvidenceTextWithEntityHighlights text="Hello John Doe" entities={entities} onEntityClick={onEntityClick} />
      </TestWrapper>
    )

    await user.click(screen.getByText('John Doe'))
    expect(onEntityClick).toHaveBeenCalledWith('e1')
  })

  it('shows tooltip details (confidence percent + unknown)', async () => {
    const user = userEvent.setup()
    render(
      <TestWrapper>
        <EvidenceTextWithEntityHighlights text="John Doe works at ACME Corp." entities={entities} />
      </TestWrapper>
    )

    await user.hover(screen.getByText('John Doe'))
    expect(await screen.findByText(/Entity:\s*John Doe/i)).toBeInTheDocument()
    expect(screen.getByText(/Confidence:\s*95%/i)).toBeInTheDocument()

    await user.unhover(screen.getByText('John Doe'))
    await user.hover(screen.getByText('ACME Corp'))
    expect(await screen.findByText(/Entity:\s*ACME Corp/i)).toBeInTheDocument()
    expect(screen.getByText(/Confidence:\s*unknown/i)).toBeInTheDocument()
  })

  it('renders plain text if no entities match', () => {
    render(
      <TestWrapper>
        <EvidenceTextWithEntityHighlights text="Plain text" entities={entities} />
      </TestWrapper>
    )

    expect(screen.getByText('Plain text')).toBeInTheDocument()
  })

  it('handles empty text (still renders)', () => {
    const { container } = render(
      <TestWrapper>
        <EvidenceTextWithEntityHighlights text="" entities={entities} />
      </TestWrapper>
    )
    expect(container.querySelector('pre')).toBeInTheDocument()
  })

  it('skips entities with missing/short names and falls back type label to "unknown"', () => {
    const invalidEntities: HighlightableEntity[] = [
      { id: 'e3', name: '', type: 'Person', mentionCount: 1 },
      { id: 'e4', name: 'A', type: 'Person', mentionCount: 1 },
      { id: 'e5', name: 'Valid', type: '', mentionCount: 1 },
      // Runtime payload can be nullish; should be ignored safely.
      { id: 'e6', name: null as unknown as string, type: 'Person', mentionCount: 1 } as unknown as HighlightableEntity,
    ]

    render(
      <TestWrapper>
        <EvidenceTextWithEntityHighlights text="A is for Apple. Valid entity here." entities={invalidEntities} />
      </TestWrapper>
    )

    expect(screen.getByText('Valid')).toBeInTheDocument()
    expect(screen.getByText(/A is for Apple/i)).toBeInTheDocument()
  })

  it('handles empty entities list', () => {
    render(
      <TestWrapper>
        <EvidenceTextWithEntityHighlights text="Some text" entities={[]} />
      </TestWrapper>
    )
    expect(screen.getByText('Some text')).toBeInTheDocument()
  })

  it('handles overlapping entities by prioritizing earlier/longer', () => {
    const overlapping: HighlightableEntity[] = [
      { id: 'e1', name: 'John Doe', type: 'Person', mentionCount: 1 },
      { id: 'e2', name: 'John', type: 'Person', mentionCount: 1 },
    ]
    render(
      <TestWrapper>
        <EvidenceTextWithEntityHighlights text="John Doe is here." entities={overlapping} />
      </TestWrapper>
    )
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.queryByText('John')).not.toBeInTheDocument()
  })

  it('defensively ignores malformed matchAll results (covers idx/len guard)', async () => {
    const user = userEvent.setup()
    const onEntityClick = vi.fn()
    const original = String.prototype.matchAll

    Object.defineProperty(String.prototype, 'matchAll', {
      configurable: true,
      writable: true,
      value: function (this: string, re: RegExp) {
        // Only intercept the specific case we care about.
        if (this === 'John' && re instanceof RegExp) {
          // Missing m[0] so `m[0]?.length ?? 0` takes the `?? 0` fallback.
          const bad: RegExpMatchArray = [] as unknown as RegExpMatchArray
          // `index` intentionally missing/undefined, and match length is 0 -> guard fails.
          const it: IterableIterator<RegExpMatchArray> = {
            [Symbol.iterator]() {
              return this
            },
            next: (() => {
              let done = false
              return () => {
                if (done) return { done: true, value: undefined as unknown as RegExpMatchArray }
                done = true
                return { done: false, value: bad }
              }
            })(),
          }
          return it
        }
        return original.call(this, re)
      },
    })

    try {
      render(
        <TestWrapper>
          <EvidenceTextWithEntityHighlights
            text="John"
            entities={[{ id: 'e1', name: 'John', type: 'Person', mentionCount: 1 }]}
            onEntityClick={onEntityClick}
          />
        </TestWrapper>
      )

      // No highlight wrapper should be created, so clicking does nothing.
      await user.click(screen.getByText('John'))
      expect(onEntityClick).not.toHaveBeenCalled()
    } finally {
      Object.defineProperty(String.prototype, 'matchAll', {
        configurable: true,
        writable: true,
        value: original,
      })
    }
  })
})
