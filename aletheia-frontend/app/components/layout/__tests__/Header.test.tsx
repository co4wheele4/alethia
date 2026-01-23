import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Header } from '../Header';

vi.mock('../ServerHeader', () => ({
  ServerHeader: () => <span>ServerHeader</span>,
}));

describe('Header', () => {
  it('renders title and optional actions, and supports mobile nav', async () => {
    const user = userEvent.setup();
    const onOpenMobileNav = vi.fn();

    render(
      <Header
        title="Dashboard"
        headerActions={<button>Action</button>}
        showMobileNavButton
        onOpenMobileNav={onOpenMobileNav}
      />,
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Action')).toBeInTheDocument();
    expect(screen.getByText('ServerHeader')).toBeInTheDocument();
    expect(screen.getByText(/nothing is asserted without evidence\./i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /open navigation/i }));
    expect(onOpenMobileNav).toHaveBeenCalledTimes(1);
  });

  it('does not render mobile nav button when callback is omitted', () => {
    render(<Header title="Docs" />);
    expect(screen.getByText('Docs')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /open navigation/i })).not.toBeInTheDocument();
  });
});

