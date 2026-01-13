/**
 * Tests for KnowledgeTreeView component
 */

import { render, screen } from '@testing-library/react';
import { KnowledgeTreeView } from '../../../components/truth-discovery/KnowledgeTreeView';
import { MuiThemeProvider } from '../../../providers/mui-theme-provider';

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MuiThemeProvider>{children}</MuiThemeProvider>
);

describe('KnowledgeTreeView', () => {
  it('should render component', () => {
    render(
      <TestWrapper>
        <KnowledgeTreeView />
      </TestWrapper>
    );

    expect(screen.getByText(/knowledgetreeview/i)).toBeInTheDocument();
    expect(screen.getByText(/todo/i)).toBeInTheDocument();
  });
});
