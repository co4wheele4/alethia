/**
 * @vitest-environment node
 */

import { getAuthToken, isAuthenticated, removeAuthToken, setAuthToken } from '../../../features/auth/utils/auth';

describe('auth utils (node env)', () => {
  it('returns safe defaults and no-ops when window is unavailable', () => {
    expect(getAuthToken()).toBeNull();
    expect(isAuthenticated()).toBe(false);
    expect(() => setAuthToken('token')).not.toThrow();
    expect(() => removeAuthToken()).not.toThrow();
  });
});

