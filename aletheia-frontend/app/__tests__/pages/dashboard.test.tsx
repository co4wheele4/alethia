/**
 * Tests for Dashboard page (evidence-first entry).
 */

import { render, screen, waitFor } from '@testing-library/react';
import { useAuth } from '../../hooks/useAuth';
import DashboardPage from '../../dashboard/page';
import { ApolloProvider } from '@apollo/client/react';
import { ApolloClient, InMemoryCache } from '@apollo/client';
import { ThemeProvider } from '../../hooks/useTheme';

vi.mock('../../hooks/useAuth');

const mockUseAuth = useAuth as any;

const mockApolloClient = new ApolloClient({
  
  link: { request: vi.fn() } as any,
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
    vi.clearAllMocks();

    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isInitialized: true,
      logout: vi.fn(),
      token: 'test-token',
      login: vi.fn(),
      register: vi.fn(),
      changePassword: vi.fn(),
      forgotPassword: vi.fn(),
      loading: false,
      error: undefined,
    });

    // AppShell uses a double/triple RAF hydration gate; simulate it deterministically.
    
    (global as any).requestAnimationFrame = (cb: FrameRequestCallback) => {
      setTimeout(() => cb(0), 0);
      return 1;
    };
    
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
