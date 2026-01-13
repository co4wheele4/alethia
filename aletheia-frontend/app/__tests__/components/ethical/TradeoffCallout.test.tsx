/**
 * Tests for TradeoffCallout component
 */

import { render, screen } from '@testing-library/react';
import { TradeoffCallout } from '../../../components/ethical/TradeoffCallout';

describe('TradeoffCallout', () => {
  it('should render with default title', () => {
    render(<TradeoffCallout />);
    expect(screen.getByText('Consider the tradeoffs')).toBeInTheDocument();
  });

  it('should render with custom title', () => {
    render(<TradeoffCallout title="Custom Tradeoff Title" />);
    expect(screen.getByText('Custom Tradeoff Title')).toBeInTheDocument();
  });

  it('should render empty state when no tradeoffs', () => {
    render(<TradeoffCallout />);
    expect(screen.getByText('TODO: Implement tradeoff display')).toBeInTheDocument();
  });

  it('should render tradeoffs', () => {
    const tradeoffs = [
      { benefit: 'Benefit 1', cost: 'Cost 1' },
      { benefit: 'Benefit 2', cost: 'Cost 2' },
    ];

    render(<TradeoffCallout tradeoffs={tradeoffs} />);
    
    // Text is split across elements, check for parts
    // "Benefit:" and "Cost:" appear multiple times (once per tradeoff)
    expect(screen.getAllByText('Benefit:').length).toBe(2);
    expect(screen.getByText('Benefit 1')).toBeInTheDocument();
    expect(screen.getAllByText('Cost:').length).toBe(2);
    expect(screen.getByText('Cost 1')).toBeInTheDocument();
    expect(screen.getByText('Benefit 2')).toBeInTheDocument();
    expect(screen.getByText('Cost 2')).toBeInTheDocument();
  });

  it('should render multiple tradeoffs', () => {
    const tradeoffs = [
      { benefit: 'B1', cost: 'C1' },
      { benefit: 'B2', cost: 'C2' },
      { benefit: 'B3', cost: 'C3' },
    ];

    render(<TradeoffCallout tradeoffs={tradeoffs} />);
    
    // Check for benefit and cost text separately
    expect(screen.getByText('B1')).toBeInTheDocument();
    expect(screen.getByText('B2')).toBeInTheDocument();
    expect(screen.getByText('B3')).toBeInTheDocument();
    expect(screen.getByText('C1')).toBeInTheDocument();
    expect(screen.getByText('C2')).toBeInTheDocument();
    expect(screen.getByText('C3')).toBeInTheDocument();
  });
});
