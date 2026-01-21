import { render, screen, fireEvent } from '@testing-library/react';
import { DocumentList } from '../components/DocumentList';
import { ThemeProvider } from '../../../hooks/useTheme';

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
);

const mockDocs = [
  { id: 'd1', title: 'Doc 1', createdAt: '2023-01-01T12:00:00Z' },
  { id: 'd2', title: 'Doc 2', createdAt: '2023-01-02T12:00:00Z' },
];

describe('DocumentList', () => {
  it('renders list of documents and handles selection', () => {
    const onSelect = vi.fn();
    render(
      <TestWrapper>
        <DocumentList
          documents={mockDocs as any}
          selectedId="d1"
          onSelect={onSelect}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Doc 1')).toBeInTheDocument();
    expect(screen.getByText('Doc 2')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Doc 2'));
    expect(onSelect).toHaveBeenCalledWith('d2');
  });

  it('renders loading state', () => {
    render(
      <TestWrapper>
        <DocumentList
          documents={[]}
          selectedId={null}
          onSelect={vi.fn()}
          loading={true}
        />
      </TestWrapper>
    );

    expect(screen.getByText(/Loading documents/i)).toBeInTheDocument();
  });

  it('renders error state', () => {
    render(
      <TestWrapper>
        <DocumentList
          documents={[]}
          selectedId={null}
          onSelect={vi.fn()}
          error={new Error('Failed to load')}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Failed to load')).toBeInTheDocument();
  });

  it('renders empty state', () => {
    render(
      <TestWrapper>
        <DocumentList
          documents={[]}
          selectedId={null}
          onSelect={vi.fn()}
        />
      </TestWrapper>
    );

    expect(screen.getByText(/No documents yet/i)).toBeInTheDocument();
  });
});
