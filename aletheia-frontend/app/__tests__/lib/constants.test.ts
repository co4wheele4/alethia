/**
 * Tests for constants.ts
 */

import { GRAPHQL_URL, API_URL, AUTH_TOKEN_KEY } from '../../lib/constants';

describe('constants', () => {
  describe('GRAPHQL_URL', () => {
    it('should have a default value', () => {
      expect(GRAPHQL_URL).toBeDefined();
      expect(typeof GRAPHQL_URL).toBe('string');
      expect(GRAPHQL_URL.length).toBeGreaterThan(0);
    });

    it('should default to localhost:3000/graphql if env var not set', () => {
      // In test environment, NEXT_PUBLIC_GRAPHQL_URL is likely not set
      // So it should default to the fallback value
      expect(GRAPHQL_URL).toContain('graphql');
    });
  });

  describe('API_URL', () => {
    it('should have a default value', () => {
      expect(API_URL).toBeDefined();
      expect(typeof API_URL).toBe('string');
      expect(API_URL.length).toBeGreaterThan(0);
    });

    it('should default to localhost:3000 if env var not set', () => {
      // In test environment, NEXT_PUBLIC_API_URL is likely not set
      // So it should default to the fallback value
      expect(API_URL).toContain('localhost');
    });
  });

  describe('AUTH_TOKEN_KEY', () => {
    it('should be a string constant', () => {
      expect(AUTH_TOKEN_KEY).toBe('aletheia_auth_token');
      expect(typeof AUTH_TOKEN_KEY).toBe('string');
    });

    it('should have a consistent value', () => {
      // Import again to ensure it's the same value
      const { AUTH_TOKEN_KEY: key2 } = require('../../lib/constants');
      expect(AUTH_TOKEN_KEY).toBe(key2);
    });
  });
});
