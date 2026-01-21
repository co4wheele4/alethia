/**
 * Tests for AletheiaLayout component
 */

import { render, screen } from '@testing-library/react';
import { AletheiaLayout } from '../AletheiaLayout';
import { MuiThemeProvider } from '../../../providers/mui-theme-provider';

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MuiThemeProvider>{children}</MuiThemeProvider>
);

describe('AletheiaLayout', () => {
  it('should render children', () => {
    render(
      <TestWrapper>
        <AletheiaLayout>
          <div>Test Content</div>
        </AletheiaLayout>
      </TestWrapper>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should render with header', () => {
    render(
      <TestWrapper>
        <AletheiaLayout header={<div>Header Content</div>}>
          <div>Body Content</div>
        </AletheiaLayout>
      </TestWrapper>
    );

    expect(screen.getByText('Header Content')).toBeInTheDocument();
    expect(screen.getByText('Body Content')).toBeInTheDocument();
  });

  it('should render with footer', () => {
    render(
      <TestWrapper>
        <AletheiaLayout footer={<div>Footer Content</div>}>
          <div>Body Content</div>
        </AletheiaLayout>
      </TestWrapper>
    );

    expect(screen.getByText('Footer Content')).toBeInTheDocument();
    expect(screen.getByText('Body Content')).toBeInTheDocument();
  });
});
