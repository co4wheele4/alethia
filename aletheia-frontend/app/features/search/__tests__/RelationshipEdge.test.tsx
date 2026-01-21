/**
 * Tests for RelationshipEdge component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { RelationshipEdge } from '../components/RelationshipEdge';

describe('RelationshipEdge', () => {
  it('should render with fromId and toId', () => {
    render(<RelationshipEdge fromId="node1" toId="node2" />);
    expect(screen.getByText(/node1.*→.*node2/i)).toBeInTheDocument();
  });

  it('should render with label', () => {
    render(<RelationshipEdge fromId="node1" toId="node2" label="relates to" />);
    expect(screen.getByText(/node1.*→.*node2.*relates to/i)).toBeInTheDocument();
  });

  it('should render without label', () => {
    render(<RelationshipEdge fromId="node1" toId="node2" />);
    expect(screen.getByText(/node1.*→.*node2/i)).toBeInTheDocument();
    expect(screen.queryByText(/\(/)).not.toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<RelationshipEdge fromId="node1" toId="node2" onClick={handleClick} />);
    
    const edge = screen.getByText(/node1.*→.*node2/i);
    fireEvent.click(edge);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should work without onClick handler', () => {
    render(<RelationshipEdge fromId="node1" toId="node2" />);
    const edge = screen.getByText(/node1.*→.*node2/i);
    
    expect(() => {
      fireEvent.click(edge);
    }).not.toThrow();
  });
});
