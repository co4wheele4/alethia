/**
 * Edge case tests for UnknownsList component
 * Tests edge cases, boundary conditions, and all code paths
 */

import { render, screen } from '@testing-library/react';
import { UnknownsList } from '../components/UnknownsList';

describe('UnknownsList Edge Cases', () => {
  it('should handle unknown with empty field', () => {
    const unknowns = [
      { id: '1', field: '' },
    ];

    const { container } = render(<UnknownsList unknowns={unknowns} />);
    
    // Empty field should still render in a list item
    const listItems = container.querySelectorAll('li');
    expect(listItems.length).toBeGreaterThan(0);
  });

  it('should handle unknown with empty reason', () => {
    const unknowns = [
      { id: '1', field: 'Field 1', reason: '' },
    ];

    render(<UnknownsList unknowns={unknowns} />);
    
    // Should show default reason when reason is empty
    expect(screen.getByText('Data is unknown or missing')).toBeInTheDocument();
  });

  it('should handle unknown with very long field name', () => {
    const longField = 'A'.repeat(200);
    const unknowns = [
      { id: '1', field: longField },
    ];

    render(<UnknownsList unknowns={unknowns} />);
    
    expect(screen.getByText(longField)).toBeInTheDocument();
  });

  it('should handle unknown with very long reason', () => {
    const longReason = 'A'.repeat(500);
    const unknowns = [
      { id: '1', field: 'Field 1', reason: longReason },
    ];

    render(<UnknownsList unknowns={unknowns} />);
    
    expect(screen.getByText(longReason)).toBeInTheDocument();
  });

  it('should handle many unknowns', () => {
    const unknowns = Array.from({ length: 100 }, (_, i) => ({
      id: `id${i}`,
      field: `Field ${i}`,
    }));

    render(<UnknownsList unknowns={unknowns} />);
    
    // Check first and last
    expect(screen.getByText('Field 0')).toBeInTheDocument();
    expect(screen.getByText('Field 99')).toBeInTheDocument();
  });

  it('should handle unknown with special characters in field', () => {
    const unknowns = [
      { id: '1', field: 'Field!@#$%^&*()' },
    ];

    render(<UnknownsList unknowns={unknowns} />);
    
    expect(screen.getByText('Field!@#$%^&*()')).toBeInTheDocument();
  });

  it('should handle unknown with special characters in reason', () => {
    const unknowns = [
      { id: '1', field: 'Field 1', reason: 'Reason!@#$%^&*()' },
    ];

    render(<UnknownsList unknowns={unknowns} />);
    
    expect(screen.getByText('Reason!@#$%^&*()')).toBeInTheDocument();
  });
});
