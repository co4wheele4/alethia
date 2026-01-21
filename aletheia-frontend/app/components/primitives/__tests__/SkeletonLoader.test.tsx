/**
 * Tests for SkeletonLoader component
 */

import { render, screen } from '@testing-library/react';
import { SkeletonLoader } from '../SkeletonLoader';
import { MuiThemeProvider } from '../../../providers/mui-theme-provider';

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MuiThemeProvider>{children}</MuiThemeProvider>
);

describe('SkeletonLoader', () => {
  it('should render skeleton loader', () => {
    render(
      <TestWrapper>
        <SkeletonLoader />
      </TestWrapper>
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should render multiple skeleton elements', () => {
    const { container } = render(
      <TestWrapper>
        <SkeletonLoader />
      </TestWrapper>
    );

    // Should have skeleton elements (MUI Skeleton components)
    const skeletons = container.querySelectorAll('[class*="MuiSkeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should have correct layout structure', () => {
    const { container } = render(
      <TestWrapper>
        <SkeletonLoader />
      </TestWrapper>
    );

    // Should have flex layout
    const box = container.querySelector('[class*="MuiBox"]');
    expect(box).toBeInTheDocument();
  });
});
