/**
 * Tests for layout index exports
 */

import * as layout from '../../../components/layout';

describe('layout index', () => {
  it('should export layout components', () => {
    expect(layout).toHaveProperty('AletheiaLayout');
    expect(layout).toHaveProperty('ContentSurface');
    expect(layout).toHaveProperty('ServerHeader');
  });
});
