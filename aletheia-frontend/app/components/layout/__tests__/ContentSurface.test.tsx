/**
 * Tests for ContentSurface component
 */

import { render, screen } from '@testing-library/react';
import { ContentSurface } from '../ContentSurface';
import { MuiThemeProvider } from '../../../providers/mui-theme-provider';

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MuiThemeProvider>{children}</MuiThemeProvider>
);

describe('ContentSurface', () => {
  it('should render children', () => {
    render(
      <TestWrapper>
        <ContentSurface>
          <div>Test Content</div>
        </ContentSurface>
      </TestWrapper>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should apply elevation when elevation > 0', () => {
    const { container } = render(
      <TestWrapper>
        <ContentSurface elevation={2}>
          <div>Test Content</div>
        </ContentSurface>
      </TestWrapper>
    );

    const box = container.firstChild as HTMLElement;
    expect(box).toBeInTheDocument();
  });

  it('should not apply elevation when elevation is 0', () => {
    const { container } = render(
      <TestWrapper>
        <ContentSurface elevation={0}>
          <div>Test Content</div>
        </ContentSurface>
      </TestWrapper>
    );

    const box = container.firstChild as HTMLElement;
    expect(box).toBeInTheDocument();
  });
});
