import { render, screen } from '@testing-library/react';
import { TransformationStepList, type TransformationStep } from '../components/TransformationStepList';
import { ThemeProvider } from '../../../hooks/useTheme';

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
);

const mockSteps: TransformationStep[] = [
  {
    key: 'step1',
    label: 'Known Step',
    status: 'known',
    timestampIso: '2023-01-01T12:00:00Z',
    detail: 'Known detail',
  },
  {
    key: 'step2',
    label: 'Inferred Step',
    status: 'inferred',
    detail: 'Inferred detail',
  },
  {
    key: 'step3',
    label: 'Unknown Step',
    status: 'unknown',
  },
];

describe('TransformationStepList', () => {
  it('renders steps correctly', () => {
    render(
      <TestWrapper>
        <TransformationStepList steps={mockSteps} />
      </TestWrapper>
    );

    expect(screen.getByText('Known Step')).toBeInTheDocument();
    expect(screen.getByText('Known detail')).toBeInTheDocument();
    expect(screen.getByText('Inferred Step')).toBeInTheDocument();
    expect(screen.getByText('Inferred detail')).toBeInTheDocument();
    expect(screen.getByText('Unknown Step')).toBeInTheDocument();
    
    // Check status pills
    expect(screen.getByText('known')).toBeInTheDocument();
    expect(screen.getByText('inferred')).toBeInTheDocument();
    expect(screen.getByText('unknown')).toBeInTheDocument();
  });
});
