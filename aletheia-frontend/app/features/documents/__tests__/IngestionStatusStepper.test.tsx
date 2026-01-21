import { render, screen } from '@testing-library/react';
import { IngestionStatusStepper } from '../components/IngestionStatusStepper';
import { ThemeProvider } from '../../../hooks/useTheme';

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
);

describe('IngestionStatusStepper', () => {
  it('renders correctly for idle state', () => {
    render(
      <TestWrapper>
        <IngestionStatusStepper progress={{ state: 'idle' }} />
      </TestWrapper>
    );
    expect(screen.getByText('Ready.')).toBeInTheDocument();
  });

  it('renders correctly for running state', () => {
    render(
      <TestWrapper>
        <IngestionStatusStepper progress={{ state: 'running', step: 'Ingesting...', current: 1, total: 10 }} />
      </TestWrapper>
    );
    expect(screen.getByText(/Ingesting\.\.\. \(1\/10\)/i)).toBeInTheDocument();
  });

  it('renders correctly for done state', () => {
    render(
      <TestWrapper>
        <IngestionStatusStepper progress={{ state: 'done', chunksCreated: 5, documentId: 'd1' }} />
      </TestWrapper>
    );
    expect(screen.getByText(/Done\. Created 5 chunk\(s\)\./i)).toBeInTheDocument();
  });

  it('renders correctly for error state', () => {
    render(
      <TestWrapper>
        <IngestionStatusStepper progress={{ state: 'error', message: 'Test Error' }} />
      </TestWrapper>
    );
    expect(screen.getByText('Test Error')).toBeInTheDocument();
  });
});
