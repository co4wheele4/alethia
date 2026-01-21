/**
 * Tests for truth-discovery index exports
 */

import * as truthDiscovery from '../components';

describe('truth-discovery index', () => {
  it('should export KnowledgeTreeView', () => {
    expect(truthDiscovery).toHaveProperty('KnowledgeTreeView');
  });
});
