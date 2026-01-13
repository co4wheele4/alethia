/**
 * Tests for FocusModeToggle component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { FocusModeToggle } from '../../../components/layout/FocusModeToggle';

describe('FocusModeToggle', () => {
  it('should render with default disabled state', () => {
    render(<FocusModeToggle />);
    const switchElement = screen.getByRole('switch');
    expect(switchElement).not.toBeChecked();
    expect(screen.getByText('Focus Mode')).toBeInTheDocument();
  });

  it('should render with enabled state', () => {
    render(<FocusModeToggle enabled={true} />);
    const switchElement = screen.getByRole('switch');
    expect(switchElement).toBeChecked();
  });

  it('should call onChange when toggled', () => {
    const handleChange = jest.fn();
    render(<FocusModeToggle onChange={handleChange} />);
    
    const switchElement = screen.getByRole('switch');
    fireEvent.click(switchElement);
    
    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it('should toggle from enabled to disabled', () => {
    const handleChange = jest.fn();
    render(<FocusModeToggle enabled={true} onChange={handleChange} />);
    
    const switchElement = screen.getByRole('switch');
    fireEvent.click(switchElement);
    
    expect(handleChange).toHaveBeenCalledWith(false);
  });

  it('should work without onChange handler', () => {
    render(<FocusModeToggle enabled={true} />);
    const switchElement = screen.getByRole('switch');
    
    expect(() => {
      fireEvent.click(switchElement);
    }).not.toThrow();
  });
});
