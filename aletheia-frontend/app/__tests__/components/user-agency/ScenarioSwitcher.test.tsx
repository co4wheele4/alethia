/**
 * Tests for ScenarioSwitcher component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { ScenarioSwitcher } from '../../../components/user-agency/ScenarioSwitcher';

describe('ScenarioSwitcher', () => {
  it('should render with no scenarios', () => {
    render(<ScenarioSwitcher />);
    // Tabs component should render even with no scenarios
    const tabs = screen.queryByRole('tablist');
    expect(tabs).toBeInTheDocument();
  });

  it('should render scenarios as tabs', () => {
    const scenarios = [
      { id: 's1', label: 'Scenario 1' },
      { id: 's2', label: 'Scenario 2' },
    ];

    render(<ScenarioSwitcher scenarios={scenarios} />);
    
    expect(screen.getByRole('tab', { name: 'Scenario 1' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Scenario 2' })).toBeInTheDocument();
  });

  it('should show selected scenario', () => {
    const scenarios = [
      { id: 's1', label: 'Scenario 1' },
      { id: 's2', label: 'Scenario 2' },
    ];

    render(<ScenarioSwitcher scenarios={scenarios} selectedScenario="s2" />);
    
    const tab2 = screen.getByRole('tab', { name: 'Scenario 2' });
    expect(tab2).toHaveAttribute('aria-selected', 'true');
  });

  it('should call onScenarioChange when tab is clicked', () => {
    const handleChange = jest.fn();
    const scenarios = [
      { id: 's1', label: 'Scenario 1' },
      { id: 's2', label: 'Scenario 2' },
    ];

    render(<ScenarioSwitcher scenarios={scenarios} onScenarioChange={handleChange} />);
    
    const tab2 = screen.getByRole('tab', { name: 'Scenario 2' });
    fireEvent.click(tab2);
    
    expect(handleChange).toHaveBeenCalledWith('s2');
  });

  it('should work without onScenarioChange handler', () => {
    const scenarios = [
      { id: 's1', label: 'Scenario 1' },
    ];

    render(<ScenarioSwitcher scenarios={scenarios} />);
    
    expect(() => {
      const tab = screen.getByRole('tab', { name: 'Scenario 1' });
      fireEvent.click(tab);
    }).not.toThrow();
  });

  it('should handle invalid selectedScenario', () => {
    const scenarios = [
      { id: 's1', label: 'Scenario 1' },
    ];

    render(<ScenarioSwitcher scenarios={scenarios} selectedScenario="nonexistent" />);
    
    // Should default to first tab
    const tab1 = screen.getByRole('tab', { name: 'Scenario 1' });
    expect(tab1).toBeInTheDocument();
  });
});
