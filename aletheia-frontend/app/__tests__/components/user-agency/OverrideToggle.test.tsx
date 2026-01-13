/**
 * Tests for OverrideToggle component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { OverrideToggle } from '../../../components/user-agency/OverrideToggle';

describe('OverrideToggle', () => {
  it('should render with default label', () => {
    render(<OverrideToggle />);
    expect(screen.getByText('Override')).toBeInTheDocument();
    const switchElement = screen.getByRole('switch');
    expect(switchElement).not.toBeChecked();
  });

  it('should render with custom label', () => {
    render(<OverrideToggle label="Custom Override" />);
    expect(screen.getByText('Custom Override')).toBeInTheDocument();
  });

  it('should render as checked when checked prop is true', () => {
    render(<OverrideToggle checked={true} />);
    const switchElement = screen.getByRole('switch');
    expect(switchElement).toBeChecked();
  });

  it('should call onChange when toggled', () => {
    const handleChange = jest.fn();
    render(<OverrideToggle onChange={handleChange} />);
    
    const switchElement = screen.getByRole('switch');
    fireEvent.click(switchElement);
    
    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it('should toggle from checked to unchecked', () => {
    const handleChange = jest.fn();
    render(<OverrideToggle checked={true} onChange={handleChange} />);
    
    const switchElement = screen.getByRole('switch');
    fireEvent.click(switchElement);
    
    expect(handleChange).toHaveBeenCalledWith(false);
  });

  it('should work without onChange handler', () => {
    render(<OverrideToggle checked={true} />);
    const switchElement = screen.getByRole('switch');
    
    expect(() => {
      fireEvent.click(switchElement);
    }).not.toThrow();
  });
});
