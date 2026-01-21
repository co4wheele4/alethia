import { render, screen } from '@testing-library/react';
import { SourcePopover } from '../components/SourcePopover';
import { ThemeProvider } from '../../../hooks/useTheme';

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
);

describe('SourcePopover', () => {
  it('renders source information when open', () => {
    const source = {
      origin: 'Test Origin',
      timestamp: '2023-01-01',
    };
    
    // Create a dummy anchor element
    const anchor = document.createElement('div');

    render(
      <TestWrapper>
        <SourcePopover open={true} anchorEl={anchor} source={source} />
      </TestWrapper>
    );

    expect(screen.getByText(/Source Information/i)).toBeInTheDocument();
    expect(screen.getByText(/Origin: Test Origin/i)).toBeInTheDocument();
    expect(screen.getByText(/Time: 2023-01-01/i)).toBeInTheDocument();
  });

  it('renders correctly with partial source info', () => {
    const anchor = document.createElement('div');
    render(
      <TestWrapper>
        <SourcePopover open={true} anchorEl={anchor} source={{ origin: 'Only Origin' }} />
      </TestWrapper>
    );

    expect(screen.getByText(/Origin: Only Origin/i)).toBeInTheDocument();
    expect(screen.queryByText(/Time:/i)).not.toBeInTheDocument();
  });
});
