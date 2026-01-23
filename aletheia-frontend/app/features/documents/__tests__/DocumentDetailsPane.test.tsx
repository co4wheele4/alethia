import { render, screen } from '@testing-library/react';
import { DocumentDetailsPane } from '../components/DocumentDetailsPane';
import { ThemeProvider } from '../../../hooks/useTheme';
import { vi } from 'vitest';

vi.mock('../components/DocumentDetailPanel', () => ({
  DocumentDetailPanel: (props: any) => (
    <div data-testid="detail-panel">
      Detail Panel: {props.documentId ?? '(none)'} • chunk={String(props.initialChunkIndex ?? '(none)')}
    </div>
  ),
}));

vi.mock('../../evidence/components/EvidenceDrawer', () => ({
  EvidenceDrawer: () => null,
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
);

describe('DocumentDetailsPane', () => {
  it('renders instructions when no document selected', () => {
    render(
      <TestWrapper>
        <DocumentDetailsPane
          selectedId={null}
          initialChunkIndex={null}
        />
      </TestWrapper>
    );

    expect(screen.getByText(/Inspect a document/i)).toBeInTheDocument();
    expect(screen.getByText(/Select a document on the left/i)).toBeInTheDocument();
  });

  it('renders detail panel when a document is selected', () => {
    render(
      <TestWrapper>
        <DocumentDetailsPane
          selectedId="d1"
          initialChunkIndex={5}
        />
      </TestWrapper>
    );

    expect(screen.getByTestId('detail-panel')).toHaveTextContent('Detail Panel: d1');
    expect(screen.getByTestId('detail-panel')).toHaveTextContent('chunk=5');
  });
});
