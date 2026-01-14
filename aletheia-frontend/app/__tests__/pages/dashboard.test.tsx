/**
 * Tests for Dashboard page
 * Tests redirect logic, hydration, features display, and interactions
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import DashboardPage from '../../dashboard/page';
import { ApolloProvider } from '@apollo/client/react';
import { ApolloClient, InMemoryCache } from '@apollo/client';
import { ThemeProvider } from '../../hooks/useTheme';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

// Mock useAuth hook
jest.mock('../../hooks/useAuth');

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;
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
  const mockReplace = jest.fn();
  const mockLogout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePathname.mockReturnValue('/dashboard');
    mockUseRouter.mockReturnValue({
      replace: mockReplace,
      push: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    global.requestAnimationFrame = mockRAF as any;

    render(
      <TestWrapper>
        <DashboardPage />
      </TestWrapper>
    );

    // Wait for hydration
    await waitFor(() => {
      expect(screen.getByText(/this system shows what is known/i)).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('should display primary navigation items', async () => {
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    global.requestAnimationFrame = mockRAF as any;

    render(
      <TestWrapper>
        <DashboardPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getAllByText(/documents/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/evidence/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/entities/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/analysis/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/provenance/i).length).toBeGreaterThan(0);
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  it('should display next steps links', async () => {
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    global.requestAnimationFrame = mockRAF as any;

    render(
      <TestWrapper>
        <DashboardPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/next steps/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /documents \(sources\)/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /evidence \(chunks\)/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /entities \(extracted\)/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /analysis \(ai outputs\)/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /provenance \(audit\)/i })).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('should show documents panel actions', async () => {
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    global.requestAnimationFrame = mockRAF as any;

    render(
      <TestWrapper>
        <DashboardPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /open library/i })).toBeInTheDocument();
    }, { timeout: 2000 });
  });
});
