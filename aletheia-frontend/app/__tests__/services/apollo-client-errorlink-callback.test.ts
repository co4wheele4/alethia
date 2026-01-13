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
  let originalIs: typeof CombinedGraphQLErrors.is;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    localStorage.clear();
    
    // Mock CombinedGraphQLErrors.is() to return true for objects with errors array
    originalIs = CombinedGraphQLErrors.is;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (CombinedGraphQLErrors as any).is = jest.fn((err: any) => {
      return err && typeof err === 'object' && Array.isArray(err.errors) && err.errors.length > 0;
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    // Restore original
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (CombinedGraphQLErrors as any).is = originalIs;
  });

  it('should handle CombinedGraphQLErrors errors', () => {
    const graphQLError = new GraphQLError('Test GraphQL error', {
      extensions: { code: 'TEST_ERROR' },
    });

    // Create an error object that CombinedGraphQLErrors.is() will recognize
    // CombinedGraphQLErrors.is() checks if error has graphQLErrors array
    const error = {
      graphQLErrors: [graphQLError],
      networkError: null,
      message: 'GraphQL error',
      errors: [graphQLError], // CombinedGraphQLErrors uses .errors property
    } as unknown as CombinedGraphQLErrors;

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

    const error = {
      graphQLErrors: [unauthorizedError],
      networkError: null,
      message: 'Unauthorized',
      errors: [unauthorizedError],
    } as unknown as CombinedGraphQLErrors;

    errorLinkHandler(error);

    expect(localStorage.getItem('aletheia_auth_token')).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('should handle GraphQL errors with Invalid token message and clear token', () => {
    const invalidTokenError = new GraphQLError('Invalid token provided');
    localStorage.setItem('aletheia_auth_token', 'invalid-token');

    const error = {
      graphQLErrors: [invalidTokenError],
      networkError: null,
      message: 'Invalid token',
      errors: [invalidTokenError],
    } as unknown as CombinedGraphQLErrors;

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
    const graphQLError = new GraphQLError('Test error', {
      extensions: { code: 'TEST_ERROR' },
    });
    // Manually set path and locations for testing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (graphQLError as any).path = ['query', 'field'];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (graphQLError as any).locations = [{ line: 1, column: 5 }];

    // Create error that will pass CombinedGraphQLErrors.is() check
    // CombinedGraphQLErrors.is() checks for specific structure
    // We need to ensure it has the errors property that the handler uses
    const error = {
      graphQLErrors: [graphQLError],
      networkError: null,
      message: 'GraphQL error',
      errors: [graphQLError], // This is what the handler checks (cge.errors)
    } as unknown as CombinedGraphQLErrors;

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
