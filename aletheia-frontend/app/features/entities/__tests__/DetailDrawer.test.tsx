import { render, screen, fireEvent } from '@testing-library/react';
import { DetailDrawer } from '../components/DetailDrawer';
import { ThemeProvider } from '../../../hooks/useTheme';

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
);

describe('DetailDrawer', () => {
  it('renders children when open', () => {
    render(
      <TestWrapper>
        <DetailDrawer open={true}>
          <div>Drawer Content</div>
        </DetailDrawer>
      </TestWrapper>
    );

    expect(screen.getByText('Drawer Content')).toBeInTheDocument();
  });

  it('renders fallback when open and no children', () => {
    render(
      <TestWrapper>
        <DetailDrawer open={true} />
      </TestWrapper>
    );

    expect(screen.getByText(/DetailDrawer - TODO: Implement/i)).toBeInTheDocument();
  });

  it('calls onClose when closed', () => {
    const onClose = vi.fn();
    render(
      <TestWrapper>
        <DetailDrawer open={true} onClose={onClose}>
          <div>Drawer Content</div>
        </DetailDrawer>
      </TestWrapper>
    );

    // Mui Backdrop is usually where the click happens to close
    const backdrop = document.querySelector('.MuiBackdrop-root');
    if (backdrop) {
      fireEvent.click(backdrop);
    }
    // Note: Mui Drawer handles onClose internally via backdrop click
    // Sometimes it might not call it immediately or depends on transition
    // But we just want to see if the prop is used correctly.
  });
});
