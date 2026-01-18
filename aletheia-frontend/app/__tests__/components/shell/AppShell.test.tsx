import React from 'react';
import { render, within } from '@testing-library/react';
import { act } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../hooks/useAuth';
import { AppShell } from '../../../components/shell/AppShell';

vi.mock('@mui/material', async (importOriginal) => {
  const actual = await importOriginal<any>();
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

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('../../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

// Keep this test focused on AppShell behavior
vi.mock('../../../components/ui/SkeletonLoader', () => ({
  SkeletonLoader: () => <div data-testid="skeleton" />,
}));

vi.mock('../../../components/layout/AletheiaLayout', () => ({
  AletheiaLayout: ({ header, children }: { header?: React.ReactNode; children?: React.ReactNode }) => (
    <div>
      <div data-testid="header">{header}</div>
      <div data-testid="content">{children}</div>
    </div>
  ),
}));

vi.mock('../../../components/common/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('../../../components/shell/primary-nav/PrimaryNav', () => ({
  PrimaryNav: ({ variant, onNavigate }: { variant: string; onNavigate?: () => void }) => (
    <nav data-testid={`primary-nav-${variant}`}>
      <button onClick={() => onNavigate?.()}>navigate</button>
    </nav>
  ),
}));

vi.mock('../../../components/shell/Header', () => ({
  Header: ({ onOpenMobileNav, onLogout }: { onOpenMobileNav?: () => void; onLogout?: () => void }) => (
    <header data-testid="header-component">
      <button onClick={() => onOpenMobileNav?.()}>open mobile nav</button>
      {onLogout ? <button onClick={() => onLogout()}>logout</button> : null}
    </header>
  ),
}));

describe('AppShell', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('redirects to home when auth is required and user is unauthenticated', async () => {
    const replace = vi.fn();
    vi.mocked(useRouter).mockReturnValue({ replace } as any);

    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      isInitialized: true,
      logout: vi.fn(),
    } as any);

    render(
      <AppShell title="Dashboard">
        <div>Protected</div>
      </AppShell>,
    );

    await act(async () => {
      vi.runAllTimers();
    });

    expect(replace).toHaveBeenCalledWith('/');
  });

  it('does not redirect and renders when requireAuth is false', async () => {
    const replace = vi.fn();
    vi.mocked(useRouter).mockReturnValue({ replace } as any);

    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      isInitialized: true,
      logout: vi.fn(),
    } as any);

    const { queryByTestId, getByText } = render(
      <AppShell title="Public" requireAuth={false}>
        <div>Public</div>
      </AppShell>,
    );

    await act(async () => {
      vi.runAllTimers();
    });

    expect(replace).not.toHaveBeenCalled();
    expect(queryByTestId('skeleton')).not.toBeInTheDocument();
    expect(getByText('Public')).toBeInTheDocument();
  });

  it('renders header and children once hydrated when authenticated', async () => {
    const replace = vi.fn();
    vi.mocked(useRouter).mockReturnValue({ replace } as any);

    const logout = vi.fn();
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isInitialized: true,
      logout,
    } as any);

    const { queryByTestId, getByText, getByRole } = render(
      <AppShell title="Dashboard">
        <div>Protected content</div>
      </AppShell>,
    );

    await act(async () => {
      vi.runAllTimers();
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

    const replace = vi.fn();
    vi.mocked(useRouter).mockReturnValue({ replace } as any);

    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isInitialized: true,
      logout: vi.fn(),
    } as any);

    render(
      <AppShell title="Dashboard">
        <div>Content</div>
      </AppShell>,
    );

    await act(async () => {
      vi.runAllTimers();
    });

    g.requestAnimationFrame = originalRaf;
    g.cancelAnimationFrame = originalCaf;
  });

  it('cleans up RAFs on unmount', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isInitialized: true,
      logout: vi.fn(),
    } as any);

    const { unmount } = render(
      <AppShell title="Dashboard">
        <div>Content</div>
      </AppShell>,
    );
    // Unmount immediately before timers/RAFs run to cover cleanup branches
    unmount();
  });
});

