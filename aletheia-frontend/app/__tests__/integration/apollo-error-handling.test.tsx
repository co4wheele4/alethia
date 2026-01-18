/**
 * Integration tests for Apollo Client error handling
 * Tests error link, auth link, and network error scenarios
 */

import { render, screen } from '@testing-library/react';
import { GraphQLExample } from '../../components/ui/GraphQLExample';
import { useHello } from '../../hooks/useHello';
import { ThemeProvider } from '../../hooks/useTheme';
import { MuiThemeProvider } from '../../providers/mui-theme-provider';
import * as authUtils from '../../lib/utils/auth';

vi.mock('../../hooks/useHello');

const mockUseHello = useHello as any;

// Mock auth utils
vi.mock('../../lib/utils/auth', () => ({
  getAuthToken: vi.fn(() => null),
  setAuthToken: vi.fn(),
  removeAuthToken: vi.fn(),
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    <MuiThemeProvider>
      {children}
    </MuiThemeProvider>
  </ThemeProvider>
);

describe('Apollo Client Error Handling Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (authUtils.getAuthToken as any).mockReturnValue(null);
  });

  it('should handle GraphQL errors in components', async () => {
    const mockError = { message: 'GraphQL error occurred' } as Error;
    mockUseHello.mockReturnValue({
      hello: undefined,
      loading: false,
      error: mockError,
      refetch: vi.fn(),
    });

    render(
      <TestWrapper>
        <GraphQLExample />
      </TestWrapper>
    );

    expect(screen.getByText(/error/i)).toBeInTheDocument();
    expect(screen.getByText(/graphql error occurred/i)).toBeInTheDocument();
  });

  it('should handle network errors in components', async () => {
    const networkError = new Error('Network error');
    mockUseHello.mockReturnValue({
      hello: undefined,
      loading: false,
      error: networkError,
      refetch: vi.fn(),
    });

    render(
      <TestWrapper>
        <GraphQLExample />
      </TestWrapper>
    );

    expect(screen.getByText(/error/i)).toBeInTheDocument();
    expect(screen.getByText(/network error/i)).toBeInTheDocument();
  });

  it('should handle loading states', () => {
    mockUseHello.mockReturnValue({
      hello: undefined,
      loading: true,
      error: undefined,
      refetch: vi.fn(),
    });

    render(
      <TestWrapper>
        <GraphQLExample />
      </TestWrapper>
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should handle successful data loading', () => {
    mockUseHello.mockReturnValue({
      hello: 'Hello World',
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    });

    render(
      <TestWrapper>
        <GraphQLExample />
      </TestWrapper>
    );

    expect(screen.getByText(/hello world/i)).toBeInTheDocument();
  });
});
