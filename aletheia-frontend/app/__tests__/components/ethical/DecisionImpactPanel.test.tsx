/**
 * Tests for DecisionImpactPanel component
 */

import { render, screen } from '@testing-library/react';
import { DecisionImpactPanel } from '../../../components/ethical/DecisionImpactPanel';

describe('DecisionImpactPanel', () => {
  it('should render with default title', () => {
    render(<DecisionImpactPanel />);
    expect(screen.getByText('Decision Impact')).toBeInTheDocument();
  });

  it('should render with custom title', () => {
    render(<DecisionImpactPanel title="Custom Impact Title" />);
    expect(screen.getByText('Custom Impact Title')).toBeInTheDocument();
  });

  it('should render empty state when no impacts', () => {
    render(<DecisionImpactPanel />);
    expect(screen.getByText('No impacts identified')).toBeInTheDocument();
  });

  it('should render impacts', () => {
    const impacts: Array<{ area: string; description: string; severity?: 'low' | 'medium' | 'high' }> = [
      { area: 'Area 1', description: 'Impact description 1' },
      { area: 'Area 2', description: 'Impact description 2', severity: 'high' },
    ];

    render(<DecisionImpactPanel impacts={impacts} />);
    
    expect(screen.getByText('Area 1')).toBeInTheDocument();
    expect(screen.getByText('Impact description 1')).toBeInTheDocument();
    expect(screen.getByText('Area 2')).toBeInTheDocument();
    expect(screen.getByText('Impact description 2')).toBeInTheDocument();
    expect(screen.getByText('high')).toBeInTheDocument();
  });

  it('should render impacts without severity', () => {
    const impacts = [
      { area: 'Area 1', description: 'Description 1' },
    ];

    render(<DecisionImpactPanel impacts={impacts} />);
    
    expect(screen.getByText('Area 1')).toBeInTheDocument();
    expect(screen.getByText('Description 1')).toBeInTheDocument();
    expect(screen.queryByText(/low|medium|high/i)).not.toBeInTheDocument();
  });

  it('should render impacts with different severities', () => {
    const impacts = [
      { area: 'Area 1', description: 'Desc 1', severity: 'low' as const },
      { area: 'Area 2', description: 'Desc 2', severity: 'medium' as const },
      { area: 'Area 3', description: 'Desc 3', severity: 'high' as const },
    ];

    render(<DecisionImpactPanel impacts={impacts} />);
    
    expect(screen.getByText('low')).toBeInTheDocument();
    expect(screen.getByText('medium')).toBeInTheDocument();
    expect(screen.getByText('high')).toBeInTheDocument();
  });
});
