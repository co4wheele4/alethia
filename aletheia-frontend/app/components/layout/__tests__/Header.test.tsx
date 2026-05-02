import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Header } from '../Header';

const mockPathname = vi.fn(() => '/dashboard');

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
}));

vi.mock('../ServerHeader', () => ({
  ServerHeader: () => <span>ServerHeader</span>,
}));

describe('Header', () => {
  beforeEach(() => {
    mockPathname.mockReturnValue('/dashboard');
  });

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

    expect(screen.getByTestId('header-page-title')).toHaveTextContent('Dashboard');
    expect(screen.getByRole('navigation', { name: /breadcrumb/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^home$/i })).toHaveAttribute('href', '/');
    expect(screen.getByText('Action')).toBeInTheDocument();
    expect(screen.getByText('ServerHeader')).toBeInTheDocument();
    expect(screen.getByText(/nothing is asserted without evidence\./i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /open navigation/i }));
    expect(onOpenMobileNav).toHaveBeenCalledTimes(1);
  });

  it('does not render mobile nav button when callback is omitted', () => {
    mockPathname.mockReturnValue('/search');
    render(<Header title="Search" />);
    expect(screen.getByTestId('header-page-title')).toHaveTextContent('Search');
    expect(screen.queryByRole('button', { name: /open navigation/i })).not.toBeInTheDocument();
  });
});

