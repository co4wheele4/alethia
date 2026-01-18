import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Header } from '../../../components/shell/Header';

vi.mock('../../../components/ui/ThemeToggle', () => ({
  ThemeToggle: () => <div data-testid="theme-toggle" />,
}));

vi.mock('../../../components/layout/ServerHeader', () => ({
  ServerHeader: () => <span>ServerHeader</span>,
}));

describe('Header', () => {
  it('renders title and optional actions, and supports mobile nav + logout', async () => {
    const user = userEvent.setup();
    const onOpenMobileNav = vi.fn();
    const onLogout = vi.fn();

    render(
      <Header
        title="Dashboard"
        headerActions={<button>Action</button>}
        showMobileNavButton
        onOpenMobileNav={onOpenMobileNav}
        onLogout={onLogout}
      />,
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Action')).toBeInTheDocument();
    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
    expect(screen.getByText('ServerHeader')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /open navigation/i }));
    expect(onOpenMobileNav).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: /logout/i }));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it('does not render mobile nav button or logout when callbacks are omitted', () => {
    render(<Header title="Docs" />);
    expect(screen.getByText('Docs')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /open navigation/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /logout/i })).not.toBeInTheDocument();
  });
});

