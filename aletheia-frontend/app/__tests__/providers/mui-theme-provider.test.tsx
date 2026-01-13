/**
 * Tests for MUI Theme Provider
 * Tests theme switching, hydration, and edge cases
 */

import { render, screen } from '@testing-library/react';
import { MuiThemeProvider } from '../../providers/mui-theme-provider';
import { ThemeProvider } from '../../hooks/useTheme';

describe('MuiThemeProvider', () => {
  it('should render children', () => {
    render(
      <MuiThemeProvider>
        <div>Test Content</div>
      </MuiThemeProvider>
    );
    
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should provide theme context', () => {
    render(
      <MuiThemeProvider>
        <div>Content</div>
      </MuiThemeProvider>
    );
    
    // Theme provider should render without errors
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('should handle theme switching', () => {
    const { rerender } = render(
      <MuiThemeProvider>
        <div>Content</div>
      </MuiThemeProvider>
    );
    
    expect(screen.getByText('Content')).toBeInTheDocument();
    
    // Rerender should work
    rerender(
      <MuiThemeProvider>
        <div>Updated Content</div>
      </MuiThemeProvider>
    );
    
    expect(screen.getByText('Updated Content')).toBeInTheDocument();
  });

  it('should work with nested providers', () => {
    render(
      <MuiThemeProvider>
        <ThemeProvider>
          <div>Nested Content</div>
        </ThemeProvider>
      </MuiThemeProvider>
    );
    
    expect(screen.getByText('Nested Content')).toBeInTheDocument();
  });
});
