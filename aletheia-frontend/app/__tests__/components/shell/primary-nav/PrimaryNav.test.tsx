import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { usePathname } from 'next/navigation';
import { PrimaryNav } from '../../../../components/shell/primary-nav/PrimaryNav';

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
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

describe('PrimaryNav', () => {
  it('renders items, highlights selected route, and calls onNavigate on click', async () => {
    vi.mocked(usePathname).mockReturnValue('/documents/123');

    const onNavigate = vi.fn();
    const user = userEvent.setup();

    render(
      <PrimaryNav
        items={[
          { href: '/dashboard', label: 'Overview' },
          { href: '/documents', label: 'Documents' },
        ]}
        footer={<div>Footer content</div>}
        onNavigate={onNavigate}
      />,
    );

    expect(screen.getByText('Footer content')).toBeInTheDocument();

    const documentsLink = screen.getByRole('link', { name: 'Documents' });
    await user.click(documentsLink);
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it('renders without footer and without onNavigate', () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard');

    render(
      <PrimaryNav
        items={[{ href: '/dashboard', label: 'Overview' }]}
        footer={undefined}
        onNavigate={undefined}
      />,
    );

    expect(screen.queryByText('Footer content')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Overview' })).toBeInTheDocument();
  });
});

