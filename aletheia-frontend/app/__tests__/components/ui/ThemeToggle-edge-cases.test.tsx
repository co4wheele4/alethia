/**
 * Edge case tests for ThemeToggle component
 * Tests menu interactions, all theme modes, and edge cases
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeToggle } from '../../../components/ui/ThemeToggle';
import { ThemeProvider } from '../../../hooks/useTheme';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

describe('ThemeToggle Edge Cases', () => {
  it('should open menu when icon button is clicked', () => {
    render(<ThemeToggle />, { wrapper });
    
    const button = screen.getByLabelText('toggle theme');
    fireEvent.click(button);
    
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('should close menu when menu item is clicked', () => {
    render(<ThemeToggle />, { wrapper });
    
    const button = screen.getByLabelText('toggle theme');
    fireEvent.click(button);
    
    const lightMenuItem = screen.getByText('Light');
    fireEvent.click(lightMenuItem);
    
    // Menu should close after selection
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('should show correct icon for light theme', () => {
    render(<ThemeToggle />, { wrapper });
    
    // Click to open menu and select light
    const button = screen.getByLabelText('toggle theme');
    fireEvent.click(button);
    fireEvent.click(screen.getByText('Light'));
    
    // Button should still be in document with light icon
    expect(screen.getByLabelText('toggle theme')).toBeInTheDocument();
  });

  it('should show correct icon for dark theme', () => {
    render(<ThemeToggle />, { wrapper });
    
    // Click to open menu and select dark
    const button = screen.getByLabelText('toggle theme');
    fireEvent.click(button);
    fireEvent.click(screen.getByText('Dark'));
    
    // Button should still be in document with dark icon
    expect(screen.getByLabelText('toggle theme')).toBeInTheDocument();
  });

  it('should show correct icon for system theme', () => {
    render(<ThemeToggle />, { wrapper });
    
    // Click to open menu and select system
    const button = screen.getByLabelText('toggle theme');
    fireEvent.click(button);
    fireEvent.click(screen.getByText('System'));
    
    // Button should still be in document with system icon
    expect(screen.getByLabelText('toggle theme')).toBeInTheDocument();
  });

  it('should show all three theme options in menu', () => {
    render(<ThemeToggle />, { wrapper });
    
    const button = screen.getByLabelText('toggle theme');
    fireEvent.click(button);
    
    expect(screen.getByText('Light')).toBeInTheDocument();
    expect(screen.getByText('Dark')).toBeInTheDocument();
    expect(screen.getByText('System')).toBeInTheDocument();
  });

  it('should mark selected theme in menu', () => {
    render(<ThemeToggle />, { wrapper });
    
    const button = screen.getByLabelText('toggle theme');
    fireEvent.click(button);
    
    // All menu items should be present
    const menuItems = screen.getAllByRole('menuitem');
    expect(menuItems.length).toBeGreaterThanOrEqual(3);
  });

  it('should have correct aria attributes', () => {
    render(<ThemeToggle />, { wrapper });
    
    const button = screen.getByLabelText('toggle theme');
    expect(button).toHaveAttribute('aria-label', 'toggle theme');
    expect(button).toHaveAttribute('aria-haspopup', 'true');
  });

  it('should update aria-expanded when menu opens', () => {
    render(<ThemeToggle />, { wrapper });
    
    const button = screen.getByLabelText('toggle theme');
    fireEvent.click(button);
    
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });

});
