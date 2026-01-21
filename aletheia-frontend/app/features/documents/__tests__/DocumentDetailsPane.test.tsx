import { render, screen } from '@testing-library/react';
import { DocumentDetailsPane } from '../components/DocumentDetailsPane';
import { ThemeProvider } from '../../../hooks/useTheme';
import { vi } from 'vitest';

vi.mock('../components/DocumentInspectionView', () => ({
  DocumentInspectionView: (props: any) => (
    <div data-testid="inspection-view">
      Inspection View: {props.document?.title ?? 'None'}
    </div>
  )
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
);

describe('DocumentDetailsPane', () => {
  it('renders loading state', () => {
    render(
      <TestWrapper>
        <DocumentDetailsPane
          selectedId="d1"
          document={null}
          chunks={[]}
          loading={true}
          error={null}
          initialChunkIndex={null}
        />
      </TestWrapper>
    );

    expect(screen.getByText(/Loading document evidence/i)).toBeInTheDocument();
  });

  it('renders error state', () => {
    render(
      <TestWrapper>
        <DocumentDetailsPane
          selectedId="d1"
          document={null}
          chunks={[]}
          loading={false}
          error={new Error('Test error')}
          initialChunkIndex={null}
        />
      </TestWrapper>
    );

    expect(screen.getByText(/Test error/i)).toBeInTheDocument();
  });

  it('renders instructions when no document selected', () => {
    render(
      <TestWrapper>
        <DocumentDetailsPane
          selectedId={null}
          document={null}
          chunks={[]}
          loading={false}
          error={null}
          initialChunkIndex={null}
        />
      </TestWrapper>
    );

    expect(screen.getByText(/Inspect a document/i)).toBeInTheDocument();
    expect(screen.getByText(/Select a document on the left/i)).toBeInTheDocument();
  });

  it('renders document details when available', () => {
    const mockDoc = { id: 'd1', title: 'Test Doc', createdAt: '2023-01-01T12:00:00Z' };
    const mockChunks = [{ id: 'c1', chunkIndex: 0, content: 'chunk content' }];

    render(
      <TestWrapper>
        <DocumentDetailsPane
          selectedId="d1"
          document={mockDoc as any}
          chunks={mockChunks as any}
          loading={false}
          error={null}
          initialChunkIndex={null}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Test Doc')).toBeInTheDocument();
    expect(screen.getByTestId('inspection-view')).toHaveTextContent('Inspection View: Test Doc');
  });
});
