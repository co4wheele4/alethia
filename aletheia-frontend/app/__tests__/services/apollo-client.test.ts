/**
 * Tests for Apollo Client service
 */

import { getApolloClient } from '../../services/apollo-client';

describe('apollo-client', () => {
  beforeEach(() => {
    // Clear any cached client
    jest.clearAllMocks();
    // Reset the singleton by accessing the module
    jest.resetModules();
  });

  it('should create Apollo Client instance', () => {
    // Only test on client side
    if (typeof window !== 'undefined') {
      const client = getApolloClient();
      expect(client).toBeDefined();
      expect(client).toHaveProperty('query');
      expect(client).toHaveProperty('mutate');
      expect(client).toHaveProperty('link');
      expect(client).toHaveProperty('cache');
    }
  });

  it('should return same instance on multiple calls (singleton)', () => {
    if (typeof window !== 'undefined') {
      const client1 = getApolloClient();
      const client2 = getApolloClient();
      const client3 = getApolloClient();
      expect(client1).toBe(client2);
      expect(client2).toBe(client3);
    }
  });

  it('should have defaultOptions configured', () => {
    if (typeof window !== 'undefined') {
      const client = getApolloClient();
      expect(client.defaultOptions).toBeDefined();
      expect(client.defaultOptions.watchQuery?.errorPolicy).toBe('all');
      expect(client.defaultOptions.query?.errorPolicy).toBe('all');
      expect(client.defaultOptions.mutate?.errorPolicy).toBe('all');
    }
  });

  it('should have InMemoryCache configured', () => {
    if (typeof window !== 'undefined') {
      const client = getApolloClient();
      expect(client.cache).toBeDefined();
      expect(client.cache).toHaveProperty('read');
      expect(client.cache).toHaveProperty('write');
    }
  });
});
