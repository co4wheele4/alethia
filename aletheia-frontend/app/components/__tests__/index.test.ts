/**
 * Tests for component index exports
 */

import * as components from '../../components';

describe('components index', () => {
  it('should export components from all categories', () => {
    // Components are exported flat, not nested by category
    // Check for representative components from each category
    expect(components).toHaveProperty('ThemeToggle'); // primitives
    expect(components).toHaveProperty('StatusPill'); // clarity
    expect(components).toHaveProperty('DataShapeInspector'); // dev
    expect(components).toHaveProperty('TradeoffCallout'); // ethical
    expect(components).toHaveProperty('SystemStatusPanel'); // integrity
    expect(components).toHaveProperty('AletheiaLayout'); // layout
    expect(components).toHaveProperty('SemanticSearchBox'); // search
    expect(components).toHaveProperty('ServiceOwnershipBadge'); // supergraph
    expect(components).toHaveProperty('KnowledgeTreeView'); // truth-discovery
    expect(components).toHaveProperty('ConflictResolver'); // user-agency
    expect(components).toHaveProperty('LoginForm'); // ui
  });
});
