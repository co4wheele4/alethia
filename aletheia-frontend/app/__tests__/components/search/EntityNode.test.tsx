/**
 * Tests for EntityNode component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { EntityNode } from '../../../components/search/EntityNode';

describe('EntityNode', () => {
  it('should render with default label', () => {
    render(<EntityNode />);
    expect(screen.getByText('Entity')).toBeInTheDocument();
  });

  it('should render with entityId', () => {
    render(<EntityNode entityId="entity-123" />);
    expect(screen.getByText('entity-123')).toBeInTheDocument();
  });

  it('should render with label', () => {
    render(<EntityNode label="Custom Entity" />);
    expect(screen.getByText('Custom Entity')).toBeInTheDocument();
  });

  it('should prioritize label over entityId', () => {
    render(<EntityNode entityId="entity-123" label="Custom Label" />);
    expect(screen.getByText('Custom Label')).toBeInTheDocument();
    expect(screen.queryByText('entity-123')).not.toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<EntityNode onClick={handleClick} />);
    
    const node = screen.getByText('Entity');
    fireEvent.click(node);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should work without onClick handler', () => {
    render(<EntityNode />);
    const node = screen.getByText('Entity');
    
    expect(() => {
      fireEvent.click(node);
    }).not.toThrow();
  });
});
