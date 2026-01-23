import React from 'react';
import { render } from '@testing-library/react';
import { act } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import { AppShell } from '../AppShell';

vi.mock('@mui/material', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    Popper: ({ open, children }: React.PropsWithChildren<{ open?: boolean }>) => {
      if (!open) return null;
      return <div data-testid="nav-menu">{children}</div>;
    },
    ClickAwayListener: ({ children }: React.PropsWithChildren) => <>{children}</>,
  };
});

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('next/link', () => ({
  __esModule: true,
  default: ({
    href,
    children,
    ...props
  }: React.PropsWithChildren<{ href: string } & React.AnchorHTMLAttributes<HTMLAnchorElement>>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('../../../features/auth/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../primitives/ThemeToggle', () => ({
  ThemeToggle: () => <div data-testid="theme-toggle" />,
}));

// Keep this test focused on AppShell behavior
vi.mock('../../primitives/SkeletonLoader', () => ({
  SkeletonLoader: () => <div data-testid="skeleton" />,
}));

vi.mock('../AletheiaLayout', () => ({
  AletheiaLayout: ({ header, children }: { header?: React.ReactNode; children?: React.ReactNode }) => (
    <div>
      <div data-testid="header">{header}</div>
      <div data-testid="content">{children}</div>
    </div>
  ),
}));

vi.mock('../../common/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('../Header', () => ({
  Header: ({
    onOpenMobileNav,
  }: {
    onOpenMobileNav?: (event: unknown) => void;
  }) => (
    <header data-testid="header-component">
      <button
        onClick={() =>
          onOpenMobileNav?.({
            currentTarget: document.createElement('button'),
          })
        }
      >
        open mobile nav
      </button>
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
    // @ts-expect-error - mocking useRouter
    vi.mocked(useRouter).mockReturnValue({ replace });

    // @ts-expect-error - mocking useAuth
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      isInitialized: true,
      logout: vi.fn(),
    });

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
    // @ts-expect-error - mocking useRouter
    vi.mocked(useRouter).mockReturnValue({ replace });

    // @ts-expect-error - mocking useAuth
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      isInitialized: true,
      logout: vi.fn(),
    });

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
    // @ts-expect-error - mocking useRouter
    vi.mocked(useRouter).mockReturnValue({ replace });

    const logout = vi.fn();
    // @ts-expect-error - mocking useAuth
    vi.mocked(useAuth).mockReturnValue({
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
      vi.runAllTimers();
    });

    expect(replace).not.toHaveBeenCalled();
    expect(queryByTestId('skeleton')).not.toBeInTheDocument();
    expect(getByText('Protected content')).toBeInTheDocument();

    // Exercise inline handlers for coverage
    await act(async () => {
      getByRole('button', { name: /open mobile nav/i }).click();
    });
    expect(queryByTestId('nav-menu')).toBeInTheDocument();

    // Logout exists when requireAuth is true
    await act(async () => {
      getByRole('menuitem', { name: /^logout$/i }).click();
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
    // @ts-expect-error - mocking useRouter
    vi.mocked(useRouter).mockReturnValue({ replace });

    // @ts-expect-error - mocking useAuth
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isInitialized: true,
      logout: vi.fn(),
    });

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
    // @ts-expect-error - mocking useAuth
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isInitialized: true,
      logout: vi.fn(),
    });

    const { unmount } = render(
      <AppShell title="Dashboard">
        <div>Content</div>
      </AppShell>,
    );
    // Unmount immediately before timers/RAFs run to cover cleanup branches
    unmount();
  });
});

