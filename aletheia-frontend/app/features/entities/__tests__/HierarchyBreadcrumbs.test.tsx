import { render, screen, fireEvent } from '@testing-library/react';
import { HierarchyBreadcrumbs } from '../components/HierarchyBreadcrumbs';
import { ThemeProvider } from '../../../hooks/useTheme';

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
);

describe('HierarchyBreadcrumbs', () => {
  it('renders fallback when path is empty', () => {
    render(
      <TestWrapper>
        <HierarchyBreadcrumbs path={[]} />
      </TestWrapper>
    );

    expect(screen.getByText(/HierarchyBreadcrumbs - TODO: Implement/i)).toBeInTheDocument();
  });

  it('renders path items and handles navigation', () => {
    const path = [
      { label: 'Home', id: 'root' },
      { label: 'Child', id: 'child' },
    ];
    const onNavigate = vi.fn();

    render(
      <TestWrapper>
        <HierarchyBreadcrumbs path={path} onNavigate={onNavigate} />
      </TestWrapper>
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Child')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Home'));
    expect(onNavigate).toHaveBeenCalledWith('root');
  });
});
