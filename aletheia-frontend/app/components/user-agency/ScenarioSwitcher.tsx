/**
 * ScenarioSwitcher Component
 * Scenario switching interface
 */

'use client';

import { Tabs, Tab, Box } from '@mui/material';

export interface Scenario {
  id: string;
  label: string;
}

export interface ScenarioSwitcherProps {
  // TODO: Define props
  scenarios?: Scenario[];
  selectedScenario?: string;
  onScenarioChange?: (scenarioId: string) => void;
}

export function ScenarioSwitcher(props: ScenarioSwitcherProps) {
  const { scenarios = [], selectedScenario, onScenarioChange } = props;

  const selectedIndex = scenarios.findIndex((s) => s.id === selectedScenario);

  return (
    <Box>
      <Tabs
        value={selectedIndex >= 0 ? selectedIndex : 0}
        onChange={(_, newValue) => {
          const scenario = scenarios[newValue];
          if (scenario) {
            onScenarioChange?.(scenario.id);
          }
        }}
      >
        {scenarios.map((scenario) => (
          <Tab key={scenario.id} label={scenario.label} />
        ))}
      </Tabs>
    </Box>
  );
}
