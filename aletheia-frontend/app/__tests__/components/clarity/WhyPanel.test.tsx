/**
 * Tests for WhyPanel component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { WhyPanel } from '../../../components/clarity/WhyPanel';

describe('WhyPanel', () => {
  it('should render the button', () => {
    render(<WhyPanel />);
    expect(screen.getByRole('button', { name: /why am i seeing this\?/i })).toBeInTheDocument();
  });

  it('should call onExplain when button is clicked', () => {
    const handleExplain = vi.fn();
    render(<WhyPanel onExplain={handleExplain} />);
    
    const button = screen.getByRole('button', { name: /why am i seeing this\?/i });
    fireEvent.click(button);
    
    expect(handleExplain).toHaveBeenCalledTimes(1);
  });

  it('should display explanation when provided', () => {
    const explanation = 'This is shown because of X reason';
    render(<WhyPanel explanation={explanation} />);
    
    expect(screen.getByText(explanation)).toBeInTheDocument();
  });

  it('should not display explanation when not provided', () => {
    render(<WhyPanel />);
    expect(screen.queryByText(/this is shown/i)).not.toBeInTheDocument();
  });

  it('should work without onExplain handler', () => {
    render(<WhyPanel />);
    const button = screen.getByRole('button', { name: /why am i seeing this\?/i });
    
    expect(() => {
      fireEvent.click(button);
    }).not.toThrow();
  });

  it('should render both button and explanation', () => {
    const handleExplain = vi.fn();
    const explanation = 'Test explanation';
    render(<WhyPanel onExplain={handleExplain} explanation={explanation} />);
    
    expect(screen.getByRole('button', { name: /why am i seeing this\?/i })).toBeInTheDocument();
    expect(screen.getByText(explanation)).toBeInTheDocument();
  });
});
