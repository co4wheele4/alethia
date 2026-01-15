/**
 * Tests for Dashboard page (evidence-first entry).
 */

import { render, screen, waitFor } from '@testing-library/react';
import { useAuth } from '../../hooks/useAuth';
import DashboardPage from '../../dashboard/page';
import { ApolloProvider } from '@apollo/client/react';
import { ApolloClient, InMemoryCache } from '@apollo/client';
import { ThemeProvider } from '../../hooks/useTheme';

jest.mock('../../hooks/useAuth');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

const mockApolloClient = new ApolloClient({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  link: undefined as any,
  cache: new InMemoryCache(),
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ApolloProvider client={mockApolloClient}>
    <ThemeProvider>
      {children}
    </ThemeProvider>
  </ApolloProvider>
);

describe('Dashboard Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isInitialized: true,
      logout: jest.fn(),
      token: 'test-token',
      login: jest.fn(),
      register: jest.fn(),
      changePassword: jest.fn(),
      forgotPassword: jest.fn(),
      loading: false,
      error: undefined,
    });

    // AppShell uses a double/triple RAF hydration gate; simulate it deterministically.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).requestAnimationFrame = (cb: FrameRequestCallback) => {
      setTimeout(() => cb(0), 0);
      return 1;
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).cancelAnimationFrame = () => {};
  });

  it('should render the evidence-first entry message', async () => {
    render(
      <TestWrapper>
        <DashboardPage />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(screen.getByText(/sources precede conclusions/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /view documents/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /add source/i })).toBeInTheDocument();
    });
  });

  it('should render primary navigation items', async () => {
    render(
      <TestWrapper>
        <DashboardPage />
      </TestWrapper>,
    );

    // AppShell navigation (evidence-first IA)
    await waitFor(() => {
      expect(screen.getAllByText(/documents/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/evidence/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/entities/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/questions/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/provenance/i).length).toBeGreaterThan(0);
    });
  });
});
