import { render, screen } from '@testing-library/react';
import { ClaimEvidenceStack } from '../components/ClaimEvidenceStack';
import { ThemeProvider } from '../../../hooks/useTheme';

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
);

describe('ClaimEvidenceStack', () => {
  it('renders placeholder message', () => {
    render(
      <TestWrapper>
        <ClaimEvidenceStack />
      </TestWrapper>
    );

    expect(screen.getByText(/Supporting evidence/i)).toBeInTheDocument();
    expect(screen.getByText(/Evidence linkage is not available/i)).toBeInTheDocument();
  });
});
