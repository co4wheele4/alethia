/**
 * Direct callback tests for errorLink
 * Tests the errorLinkHandler function directly
 */

import { CombinedGraphQLErrors } from '@apollo/client';
import { GraphQLError } from 'graphql';
import { errorLinkHandler } from '../../services/apollo-client';

// Mock the constants
jest.mock('../../lib/constants', () => ({
  GRAPHQL_URL: 'http://localhost:4000/graphql',
}));

describe('errorLinkHandler Tests', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    localStorage.clear();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should handle CombinedGraphQLErrors errors', () => {
    const graphQLError = new GraphQLError('Test GraphQL error', {
      extensions: { code: 'TEST_ERROR' },
    });

    // Create a CombinedGraphQLErrors instance
    const error = new CombinedGraphQLErrors({
      graphQLErrors: [graphQLError],
      errorMessage: 'GraphQL error',
    });

    // CombinedGraphQLErrors uses .errors property (not .graphQLErrors)
    // Set it manually if constructor didn't populate it
    if (!error.errors || error.errors.length === 0) {
      (error as any).errors = [graphQLError];
    }

    // Call the handler directly
    errorLinkHandler(error);

    expect(consoleErrorSpy).toHaveBeenCalled();
    const errorCalls = consoleErrorSpy.mock.calls.filter(call => {
      const msg = String(call[0]);
      return msg.includes('[GraphQL error]');
    });
    expect(errorCalls.length).toBeGreaterThan(0);
  });

  it('should handle GraphQL errors with Unauthorized message and clear token', () => {
    const unauthorizedError = new GraphQLError('Unauthorized access');
    localStorage.setItem('aletheia_auth_token', 'test-token');

    const error = new CombinedGraphQLErrors({
      graphQLErrors: [unauthorizedError],
      errorMessage: 'Unauthorized',
    });
    if (!error.errors || error.errors.length === 0) {
      (error as any).errors = [unauthorizedError];
    }

    errorLinkHandler(error);

    expect(localStorage.getItem('aletheia_auth_token')).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('should handle GraphQL errors with Invalid token message and clear token', () => {
    const invalidTokenError = new GraphQLError('Invalid token provided');
    localStorage.setItem('aletheia_auth_token', 'invalid-token');

    const error = new CombinedGraphQLErrors({
      graphQLErrors: [invalidTokenError],
      errorMessage: 'Invalid token',
    });
    if (!error.errors || error.errors.length === 0) {
      (error as any).errors = [invalidTokenError];
    }

    errorLinkHandler(error);

    expect(localStorage.getItem('aletheia_auth_token')).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('should handle network errors', () => {
    const networkError = new Error('Network request failed');

    errorLinkHandler(networkError);

    expect(consoleErrorSpy).toHaveBeenCalled();
    const errorCalls = consoleErrorSpy.mock.calls.filter(call => {
      const msg = String(call[0]);
      return msg.includes('[Network error]');
    });
    expect(errorCalls.length).toBeGreaterThan(0);
  });

  it('should handle GraphQL errors with locations and path', () => {
    const graphQLError = new GraphQLError(
      'Test error',
      {
        extensions: { code: 'TEST_ERROR' },
      },
      undefined,
      undefined,
      ['query', 'field'],
      undefined,
      [{ line: 1, column: 5 }]
    );

    const error = new CombinedGraphQLErrors({
      graphQLErrors: [graphQLError],
      errorMessage: 'GraphQL error',
    });
    if (!error.errors || error.errors.length === 0) {
      (error as any).errors = [graphQLError];
    }

    errorLinkHandler(error);

    expect(consoleErrorSpy).toHaveBeenCalled();
    const errorCalls = consoleErrorSpy.mock.calls.filter(call => {
      const msg = String(call[0]);
      return msg.includes('[GraphQL error]');
    });
    expect(errorCalls.length).toBeGreaterThan(0);
    const errorLog = String(errorCalls[0][0]);
    expect(errorLog).toContain('Location');
    expect(errorLog).toContain('Path');
  });
});
