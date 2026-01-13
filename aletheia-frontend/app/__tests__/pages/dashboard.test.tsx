/**
 * Tests for Dashboard page
 * Tests redirect logic, hydration, features display, and interactions
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import DashboardPage from '../../dashboard/page';
import { ApolloProvider } from '@apollo/client/react';
import { ApolloClient, InMemoryCache } from '@apollo/client';
import { ThemeProvider } from '../../hooks/useTheme';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock useAuth hook
jest.mock('../../hooks/useAuth');

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

const mockApolloClient = new ApolloClient({
  uri: 'http://localhost:3000/graphql',
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
  const mockReplace = jest.fn();
  const mockLogout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      replace: mockReplace,
      push: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
    } as any);
  });

  it('should show skeleton loader when not mounted', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isInitialized: true,
      logout: mockLogout,
      token: 'test-token',
      login: jest.fn(),
      register: jest.fn(),
      changePassword: jest.fn(),
      forgotPassword: jest.fn(),
      loading: false,
      error: undefined,
    });

    render(
      <TestWrapper>
        <DashboardPage />
      </TestWrapper>
    );

    // Should show skeleton loader initially
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should redirect to home when not authenticated', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isInitialized: true,
      logout: mockLogout,
      token: null,
      login: jest.fn(),
      register: jest.fn(),
      changePassword: jest.fn(),
      forgotPassword: jest.fn(),
      loading: false,
      error: undefined,
    });

    render(
      <TestWrapper>
        <DashboardPage />
      </TestWrapper>
    );

    // Wait for redirect to happen
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/');
    }, { timeout: 2000 });
  });

  it('should display welcome message when authenticated', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isInitialized: true,
      logout: mockLogout,
      token: 'test-token',
      login: jest.fn(),
      register: jest.fn(),
      changePassword: jest.fn(),
      forgotPassword: jest.fn(),
      loading: false,
      error: undefined,
    });

    // Mock requestAnimationFrame for hydration
    const mockRAF = jest.fn((cb) => {
      setTimeout(cb, 0);
      return 1;
    });
    global.requestAnimationFrame = mockRAF as any;

    render(
      <TestWrapper>
        <DashboardPage />
      </TestWrapper>
    );

    // Wait for hydration
    await waitFor(() => {
      expect(screen.getByText(/welcome to aletheia/i)).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('should display all features', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isInitialized: true,
      logout: mockLogout,
      token: 'test-token',
      login: jest.fn(),
      register: jest.fn(),
      changePassword: jest.fn(),
      forgotPassword: jest.fn(),
      loading: false,
      error: undefined,
    });

    const mockRAF = jest.fn((cb) => {
      setTimeout(cb, 0);
      return 1;
    });
    global.requestAnimationFrame = mockRAF as any;

    render(
      <TestWrapper>
        <DashboardPage />
      </TestWrapper>
    );

    await waitFor(() => {
      // Use getAllByText since these might appear multiple times
      expect(screen.getAllByText(/truth discovery/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/clarity.*sense-making/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/integrity.*trust/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/semantic search/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/user agency/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/change history/i).length).toBeGreaterThan(0);
    }, { timeout: 2000 });
  });

  it('should open change password dialog when button is clicked', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isInitialized: true,
      logout: mockLogout,
      token: 'test-token',
      login: jest.fn(),
      register: jest.fn(),
      changePassword: jest.fn(),
      forgotPassword: jest.fn(),
      loading: false,
      error: undefined,
    });

    const mockRAF = jest.fn((cb) => {
      setTimeout(cb, 0);
      return 1;
    });
    global.requestAnimationFrame = mockRAF as any;

    render(
      <TestWrapper>
        <DashboardPage />
      </TestWrapper>
    );

    await waitFor(() => {
      const changePasswordButton = screen.getByRole('button', { name: /change password/i });
      fireEvent.click(changePasswordButton);
    }, { timeout: 2000 });

    await waitFor(() => {
      // "Change password" appears in button and dialog, use getAllByText
      const changePasswordElements = screen.getAllByText(/change password/i);
      expect(changePasswordElements.length).toBeGreaterThan(0);
      // Dialog should be open - check for dialog or presentation role
      const dialog = screen.queryByRole('dialog') || screen.queryByRole('presentation');
      expect(dialog).toBeInTheDocument();
    });
  });

  it('should call logout when logout button is clicked', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isInitialized: true,
      logout: mockLogout,
      token: 'test-token',
      login: jest.fn(),
      register: jest.fn(),
      changePassword: jest.fn(),
      forgotPassword: jest.fn(),
      loading: false,
      error: undefined,
    });

    const mockRAF = jest.fn((cb) => {
      setTimeout(cb, 0);
      return 1;
    });
    global.requestAnimationFrame = mockRAF as any;

    render(
      <TestWrapper>
        <DashboardPage />
      </TestWrapper>
    );

    await waitFor(() => {
      const logoutButton = screen.getByRole('button', { name: /logout/i });
      fireEvent.click(logoutButton);
    }, { timeout: 2000 });

    expect(mockLogout).toHaveBeenCalled();
  });

  it('should display quick actions', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isInitialized: true,
      logout: mockLogout,
      token: 'test-token',
      login: jest.fn(),
      register: jest.fn(),
      changePassword: jest.fn(),
      forgotPassword: jest.fn(),
      loading: false,
      error: undefined,
    });

    const mockRAF = jest.fn((cb) => {
      setTimeout(cb, 0);
      return 1;
    });
    global.requestAnimationFrame = mockRAF as any;

    render(
      <TestWrapper>
        <DashboardPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getAllByText(/quick actions/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/explore knowledge/i).length).toBeGreaterThan(0);
      // "Search" might appear multiple times, so use getAllByText
      expect(screen.getAllByText(/^search$/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/view history/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/settings/i).length).toBeGreaterThan(0);
    }, { timeout: 2000 });
  });

  it('should display truth state indicators', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isInitialized: true,
      logout: mockLogout,
      token: 'test-token',
      login: jest.fn(),
      register: jest.fn(),
      changePassword: jest.fn(),
      forgotPassword: jest.fn(),
      loading: false,
      error: undefined,
    });

    const mockRAF = jest.fn((cb) => {
      setTimeout(cb, 0);
      return 1;
    });
    global.requestAnimationFrame = mockRAF as any;

    render(
      <TestWrapper>
        <DashboardPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/truth states/i)).toBeInTheDocument();
    }, { timeout: 2000 });
  });
});
