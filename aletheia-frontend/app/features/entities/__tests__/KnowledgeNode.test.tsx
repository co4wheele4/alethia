import { render, screen } from '@testing-library/react';
import { KnowledgeNode } from '../components/KnowledgeNode';
import { ThemeProvider } from '../../../hooks/useTheme';

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
);

describe('KnowledgeNode', () => {
  it('renders fallback when implemented', () => {
    render(
      <TestWrapper>
        <KnowledgeNode />
      </TestWrapper>
    );

    expect(screen.getByText(/KnowledgeNode - TODO: Implement/i)).toBeInTheDocument();
  });
});
