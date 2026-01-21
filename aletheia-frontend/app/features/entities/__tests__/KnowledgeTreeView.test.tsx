import { render, screen } from '@testing-library/react';
import { KnowledgeTreeView } from '../components/KnowledgeTreeView';
import { ThemeProvider } from '../../../hooks/useTheme';

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
);

describe('KnowledgeTreeView', () => {
  it('renders fallback when implemented', () => {
    render(
      <TestWrapper>
        <KnowledgeTreeView />
      </TestWrapper>
    );

    expect(screen.getByText(/KnowledgeTreeView - TODO: Implement/i)).toBeInTheDocument();
  });
});
