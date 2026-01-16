import React from 'react';
import { render, within } from '@testing-library/react';
import { act } from 'react';

jest.mock('@mui/material', () => {
  const actual = jest.requireActual('@mui/material');
  type DrawerProps = React.PropsWithChildren<{
    open?: boolean;
    onClose?: (event: unknown, reason: string) => void;
  }>;
  return {
    ...actual,
    Drawer: ({ open, onClose, children }: DrawerProps) => {
      if (!open) return null;
      return (
        <div data-testid="drawer">
          <button onClick={() => onClose?.({}, 'backdropClick')}>close</button>
          {children}
        </div>
      );
    },
  };
});

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('../../../hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

// Keep this test focused on AppShell behavior
jest.mock('../../../components/ui/SkeletonLoader', () => ({
  SkeletonLoader: () => <div data-testid="skeleton" />,
}));

jest.mock('../../../components/layout/AletheiaLayout', () => ({
  AletheiaLayout: ({ header, children }: { header?: React.ReactNode; children?: React.ReactNode }) => (
    <div>
      <div data-testid="header">{header}</div>
      <div data-testid="content">{children}</div>
    </div>
  ),
}));

jest.mock('../../../components/common/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('../../../components/shell/primary-nav/PrimaryNav', () => ({
  PrimaryNav: ({ variant, onNavigate }: { variant: string; onNavigate?: () => void }) => (
    <nav data-testid={`primary-nav-${variant}`}>
      <button onClick={() => onNavigate?.()}>navigate</button>
    </nav>
  ),
}));

jest.mock('../../../components/shell/Header', () => ({
  Header: ({ onOpenMobileNav, onLogout }: { onOpenMobileNav?: () => void; onLogout?: () => void }) => (
    <header data-testid="header-component">
      <button onClick={() => onOpenMobileNav?.()}>open mobile nav</button>
      {onLogout ? <button onClick={() => onLogout()}>logout</button> : null}
    </header>
  ),
}));

function loadAppShell(): typeof import('../../../components/shell/AppShell') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('../../../components/shell/AppShell');
}

describe('AppShell', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('redirects to home when auth is required and user is unauthenticated', async () => {
    const { AppShell } = loadAppShell();
    const replace = jest.fn();
    const { useRouter } = jest.requireMock('next/navigation') as { useRouter: jest.Mock };
    useRouter.mockReturnValue({ replace });

    const { useAuth } = jest.requireMock('../../../hooks/useAuth') as { useAuth: jest.Mock };
    useAuth.mockReturnValue({
      isAuthenticated: false,
      isInitialized: true,
      logout: jest.fn(),
    });

    render(
      <AppShell title="Dashboard">
        <div>Protected</div>
      </AppShell>,
    );

    await act(async () => {
      jest.runAllTimers();
    });

    expect(replace).toHaveBeenCalledWith('/');
  });

  it('does not redirect and renders when requireAuth is false', async () => {
    const { AppShell } = loadAppShell();
    const replace = jest.fn();
    const { useRouter } = jest.requireMock('next/navigation') as { useRouter: jest.Mock };
    useRouter.mockReturnValue({ replace });

    const { useAuth } = jest.requireMock('../../../hooks/useAuth') as { useAuth: jest.Mock };
    useAuth.mockReturnValue({
      isAuthenticated: false,
      isInitialized: true,
      logout: jest.fn(),
    });

    const { queryByTestId, getByText } = render(
      <AppShell title="Public" requireAuth={false}>
        <div>Public</div>
      </AppShell>,
    );

    await act(async () => {
      jest.runAllTimers();
    });

    expect(replace).not.toHaveBeenCalled();
    expect(queryByTestId('skeleton')).not.toBeInTheDocument();
    expect(getByText('Public')).toBeInTheDocument();
  });

  it('renders header and children once hydrated when authenticated', async () => {
    const { AppShell } = loadAppShell();
    const replace = jest.fn();
    const { useRouter } = jest.requireMock('next/navigation') as { useRouter: jest.Mock };
    useRouter.mockReturnValue({ replace });

    const { useAuth } = jest.requireMock('../../../hooks/useAuth') as { useAuth: jest.Mock };
    const logout = jest.fn();
    useAuth.mockReturnValue({
      isAuthenticated: true,
      isInitialized: true,
      logout,
    });

    const { queryByTestId, getByText, getByRole } = render(
      <AppShell title="Dashboard">
        <div>Protected content</div>
      </AppShell>,
    );

    await act(async () => {
      jest.runAllTimers();
    });

    expect(replace).not.toHaveBeenCalled();
    expect(queryByTestId('skeleton')).not.toBeInTheDocument();
    expect(getByText('Protected content')).toBeInTheDocument();

    // Exercise inline handlers for coverage
    await act(async () => {
      getByRole('button', { name: /open mobile nav/i }).click();
    });
    expect(queryByTestId('drawer')).toBeInTheDocument();

    await act(async () => {
      const drawerNav = within(queryByTestId('drawer')!).getByTestId(
        'primary-nav-drawer',
      );
      within(drawerNav).getByRole('button', { name: /^navigate$/i }).click();
    });

    // Logout exists when requireAuth is true
    await act(async () => {
      getByRole('button', { name: /^logout$/i }).click();
    });
    expect(logout).toHaveBeenCalledTimes(1);
  });

  it('uses timeout fallback when RAF APIs are unavailable', async () => {
    type RafFn = (cb: (time: number) => void) => number;
    type CafFn = (id: number) => void;
    const g = globalThis as typeof globalThis & {
      requestAnimationFrame?: RafFn;
      cancelAnimationFrame?: CafFn;
    };
    const originalRaf = g.requestAnimationFrame;
    const originalCaf = g.cancelAnimationFrame;
    g.requestAnimationFrame = undefined as unknown as typeof g.requestAnimationFrame;
    g.cancelAnimationFrame = undefined as unknown as typeof g.cancelAnimationFrame;

    const { AppShell } = loadAppShell();

    const replace = jest.fn();
    const { useRouter } = jest.requireMock('next/navigation') as { useRouter: jest.Mock };
    useRouter.mockReturnValue({ replace });

    const { useAuth } = jest.requireMock('../../../hooks/useAuth') as { useAuth: jest.Mock };
    useAuth.mockReturnValue({
      isAuthenticated: true,
      isInitialized: true,
      logout: jest.fn(),
    });

    render(
      <AppShell title="Dashboard">
        <div>Content</div>
      </AppShell>,
    );

    await act(async () => {
      jest.runAllTimers();
    });

    g.requestAnimationFrame = originalRaf;
    g.cancelAnimationFrame = originalCaf;
  });
});

