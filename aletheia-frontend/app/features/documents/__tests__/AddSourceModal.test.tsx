import { render, screen } from '@testing-library/react';
import { AddSourceModal } from '../components/AddSourceModal';
import { ThemeProvider } from '../../../hooks/useTheme';
import { MockedProvider } from '@apollo/client/testing/react';
import { vi } from 'vitest';

vi.mock('../components/IngestDocumentsDialog', () => ({
  IngestDocumentsDialog: (props: any) => (
    <div data-testid="ingest-dialog">
      Mocked Dialog {props.open ? 'Open' : 'Closed'}
    </div>
  ),
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    <MockedProvider mocks={[]} addTypename={false}>
      {children}
    </MockedProvider>
  </ThemeProvider>
);

describe('AddSourceModal', () => {
  it('renders IngestDocumentsDialog with props', () => {
    const onClose = vi.fn();
    const onIngested = vi.fn();
    
    const { rerender } = render(
      <TestWrapper>
        <AddSourceModal
          open={true}
          onClose={onClose}
          userId="u1"
          onIngested={onIngested}
        />
      </TestWrapper>
    );

    expect(screen.getByTestId('ingest-dialog')).toHaveTextContent('Mocked Dialog Open');

    rerender(
      <TestWrapper>
        <AddSourceModal
          open={false}
          onClose={onClose}
          userId="u1"
          onIngested={onIngested}
        />
      </TestWrapper>
    );

    expect(screen.getByTestId('ingest-dialog')).toHaveTextContent('Mocked Dialog Closed');
  });
});
