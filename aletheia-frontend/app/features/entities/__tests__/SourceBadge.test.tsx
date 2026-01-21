import { render, screen, fireEvent } from '@testing-library/react';
import { SourceBadge } from '../components/SourceBadge';
import { ThemeProvider } from '../../../hooks/useTheme';

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
);

describe('SourceBadge', () => {
  it('renders source label when provided', () => {
    render(
      <TestWrapper>
        <SourceBadge source="Test Source" />
      </TestWrapper>
    );

    expect(screen.getByText('Test Source')).toBeInTheDocument();
  });

  it('renders fallback when no source provided', () => {
    render(
      <TestWrapper>
        <SourceBadge />
      </TestWrapper>
    );

    expect(screen.getByText('Source')).toBeInTheDocument();
  });

  it('handles click when provided', () => {
    const onClick = vi.fn();
    render(
      <TestWrapper>
        <SourceBadge source="Test Source" onClick={onClick} />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText('Test Source'));
    expect(onClick).toHaveBeenCalled();
  });
});
