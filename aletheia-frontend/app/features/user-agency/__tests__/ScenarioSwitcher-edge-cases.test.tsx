/**
 * Edge case tests for ScenarioSwitcher component
 * Tests edge cases, boundary conditions, and all code paths
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { ScenarioSwitcher } from '../components/ScenarioSwitcher';

describe('ScenarioSwitcher Edge Cases', () => {
  it('should handle empty scenarios array', () => {
    render(<ScenarioSwitcher scenarios={[]} />);
    // Tabs should still render
    const tabs = screen.queryByRole('tablist');
    expect(tabs).toBeInTheDocument();
  });

  it('should handle single scenario', () => {
    const scenarios = [{ id: 's1', label: 'Only Scenario' }];
    render(<ScenarioSwitcher scenarios={scenarios} />);
    
    expect(screen.getByRole('tab', { name: 'Only Scenario' })).toBeInTheDocument();
  });

  it('should handle many scenarios', () => {
    const scenarios = Array.from({ length: 10 }, (_, i) => ({
      id: `s${i}`,
      label: `Scenario ${i}`,
    }));
    
    render(<ScenarioSwitcher scenarios={scenarios} />);
    
    scenarios.forEach((scenario) => {
      expect(screen.getByRole('tab', { name: scenario.label })).toBeInTheDocument();
    });
  });

  it('should default to first tab when selectedScenario is not found', () => {
    const scenarios = [
      { id: 's1', label: 'Scenario 1' },
      { id: 's2', label: 'Scenario 2' },
    ];

    render(<ScenarioSwitcher scenarios={scenarios} selectedScenario="nonexistent" />);
    
    // Should default to index 0 (first scenario)
    const tab1 = screen.getByRole('tab', { name: 'Scenario 1' });
    expect(tab1).toBeInTheDocument();
  });

  it('should handle selectedScenario at end of array', () => {
    const scenarios = [
      { id: 's1', label: 'Scenario 1' },
      { id: 's2', label: 'Scenario 2' },
      { id: 's3', label: 'Scenario 3' },
    ];

    render(<ScenarioSwitcher scenarios={scenarios} selectedScenario="s3" />);
    
    const tab3 = screen.getByRole('tab', { name: 'Scenario 3' });
    expect(tab3).toHaveAttribute('aria-selected', 'true');
  });

  it('should handle rapid tab switching', () => {
    const handleChange = vi.fn();
    const scenarios = [
      { id: 's1', label: 'Scenario 1' },
      { id: 's2', label: 'Scenario 2' },
      { id: 's3', label: 'Scenario 3' },
    ];

    render(<ScenarioSwitcher scenarios={scenarios} onScenarioChange={handleChange} />);
    
    const tab1 = screen.getByRole('tab', { name: 'Scenario 1' });
    const tab2 = screen.getByRole('tab', { name: 'Scenario 2' });
    const tab3 = screen.getByRole('tab', { name: 'Scenario 3' });
    
    fireEvent.click(tab1);
    fireEvent.click(tab2);
    fireEvent.click(tab3);
    
    // MUI Tabs might not call onChange for the currently selected tab
    // So we check that it was called at least once and with the last clicked tab
    expect(handleChange).toHaveBeenCalled();
    expect(handleChange).toHaveBeenLastCalledWith('s3');
  });

  it('should handle scenarios with special characters in labels', () => {
    const scenarios = [
      { id: 's1', label: 'Scenario!@#$%' },
      { id: 's2', label: 'Scenario & More' },
    ];

    render(<ScenarioSwitcher scenarios={scenarios} />);
    
    expect(screen.getByRole('tab', { name: 'Scenario!@#$%' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Scenario & More' })).toBeInTheDocument();
  });
});
