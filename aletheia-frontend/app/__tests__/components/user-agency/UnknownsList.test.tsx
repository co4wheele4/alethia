/**
 * Tests for UnknownsList component
 */

import { render, screen } from '@testing-library/react';
import { UnknownsList } from '../../../components/user-agency/UnknownsList';

describe('UnknownsList', () => {
  it('should render title', () => {
    render(<UnknownsList />);
    expect(screen.getByText('Unknown or Missing Data')).toBeInTheDocument();
  });

  it('should render empty state when no unknowns', () => {
    render(<UnknownsList />);
    expect(screen.getByText('No unknown data')).toBeInTheDocument();
  });

  it('should render unknown items', () => {
    const unknowns = [
      { id: '1', field: 'Field 1', reason: 'Reason 1' },
      { id: '2', field: 'Field 2' },
    ];

    render(<UnknownsList unknowns={unknowns} />);
    
    expect(screen.getByText('Field 1')).toBeInTheDocument();
    expect(screen.getByText('Reason 1')).toBeInTheDocument();
    expect(screen.getByText('Field 2')).toBeInTheDocument();
    expect(screen.getByText('Data is unknown or missing')).toBeInTheDocument();
  });

  it('should render multiple unknown items', () => {
    const unknowns = [
      { id: '1', field: 'Field 1' },
      { id: '2', field: 'Field 2' },
      { id: '3', field: 'Field 3' },
    ];

    render(<UnknownsList unknowns={unknowns} />);
    
    expect(screen.getByText('Field 1')).toBeInTheDocument();
    expect(screen.getByText('Field 2')).toBeInTheDocument();
    expect(screen.getByText('Field 3')).toBeInTheDocument();
  });
});
