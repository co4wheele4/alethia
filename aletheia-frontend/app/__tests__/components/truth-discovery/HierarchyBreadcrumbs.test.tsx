/**
 * Tests for HierarchyBreadcrumbs component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { HierarchyBreadcrumbs } from '../../../components/truth-discovery/HierarchyBreadcrumbs';

describe('HierarchyBreadcrumbs', () => {
  it('should render placeholder when no path', () => {
    render(<HierarchyBreadcrumbs />);
    expect(screen.getByText('HierarchyBreadcrumbs - TODO: Implement')).toBeInTheDocument();
  });

  it('should render breadcrumb path', () => {
    const path = [
      { id: '1', label: 'Level 1' },
      { id: '2', label: 'Level 2' },
      { id: '3', label: 'Level 3' },
    ];

    render(<HierarchyBreadcrumbs path={path} />);
    
    expect(screen.getByText('Level 1')).toBeInTheDocument();
    expect(screen.getByText('Level 2')).toBeInTheDocument();
    expect(screen.getByText('Level 3')).toBeInTheDocument();
  });

  it('should call onNavigate when breadcrumb is clicked', () => {
    const handleNavigate = jest.fn();
    const path = [
      { id: '1', label: 'Level 1' },
      { id: '2', label: 'Level 2' },
    ];

    render(<HierarchyBreadcrumbs path={path} onNavigate={handleNavigate} />);
    
    const level2 = screen.getByText('Level 2');
    fireEvent.click(level2);
    
    expect(handleNavigate).toHaveBeenCalledWith('2');
  });

  it('should work without onNavigate handler', () => {
    const path = [
      { id: '1', label: 'Level 1' },
    ];

    render(<HierarchyBreadcrumbs path={path} />);
    
    expect(() => {
      const level1 = screen.getByText('Level 1');
      fireEvent.click(level1);
    }).not.toThrow();
  });
});
