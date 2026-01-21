import { render, screen } from '@testing-library/react';
import { DisclosurePanel } from '../components/DisclosurePanel';
import { ThemeProvider } from '../../../hooks/useTheme';

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
);

describe('DisclosurePanel', () => {
  it('renders title and summary when provided', () => {
    render(
      <TestWrapper>
        <DisclosurePanel title="Test Title" summary="Test Summary">
          <div>Panel Content</div>
        </DisclosurePanel>
      </TestWrapper>
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Summary')).toBeInTheDocument();
    expect(screen.getByText('Panel Content')).toBeInTheDocument();
  });

  it('renders fallback when no title or children provided', () => {
    render(
      <TestWrapper>
        <DisclosurePanel />
      </TestWrapper>
    );

    expect(screen.getByText(/More context/i)).toBeInTheDocument();
    expect(screen.getByText(/DisclosurePanel - TODO: Implement/i)).toBeInTheDocument();
  });
});
