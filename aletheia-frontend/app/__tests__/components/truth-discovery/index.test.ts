/**
 * Tests for truth-discovery index exports
 */

import * as truthDiscovery from '../../../components/truth-discovery';

describe('truth-discovery index', () => {
  it('should export KnowledgeTreeView', () => {
    expect(truthDiscovery).toHaveProperty('KnowledgeTreeView');
  });
});
