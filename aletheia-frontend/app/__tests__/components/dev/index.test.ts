/**
 * Tests for dev index exports
 */

import * as dev from '../../../components/dev';

describe('dev index', () => {
  it('should export dev components', () => {
    expect(dev).toHaveProperty('DataShapeInspector');
  });
});
