/**
 * Tests for SourceBadge component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { SourceBadge } from '../../../components/truth-discovery/SourceBadge';

describe('SourceBadge', () => {
  it('should render with default label', () => {
    render(<SourceBadge />);
    expect(screen.getByText('Source')).toBeInTheDocument();
  });

  it('should render with source name', () => {
    render(<SourceBadge source="Database" />);
    expect(screen.getByText('Database')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<SourceBadge source="Test Source" onClick={handleClick} />);
    
    const badge = screen.getByText('Test Source');
    fireEvent.click(badge);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should work without onClick handler', () => {
    render(<SourceBadge source="Test Source" />);
    const badge = screen.getByText('Test Source');
    
    expect(() => {
      fireEvent.click(badge);
    }).not.toThrow();
  });
});
