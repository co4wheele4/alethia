import { Request, Response } from 'express';
import { GraphQLFormattedError } from 'graphql';
import { GQL_ERROR_CODES } from '../graphql/errors/graphql-error-codes';
import { createGraphQLContext, formatGraphQLError } from './graphql-config';

describe('GraphQL Config', () => {
  describe('createGraphQLContext', () => {
    it('should return request and response from context', () => {
      const mockReq = { headers: {} } as Request;
      const mockRes = { status: jest.fn() } as unknown as Response;

      const context = createGraphQLContext({ req: mockReq, res: mockRes });

      expect(context).toEqual({ req: mockReq, res: mockRes });
      expect(context.req).toBe(mockReq);
      expect(context.res).toBe(mockRes);
    });
  });

  describe('formatGraphQLError', () => {
    it('should format error with all properties', () => {
      const mockError: GraphQLFormattedError = {
        message: 'Test error',
        extensions: { code: 'TEST_CODE' },
        path: ['test', 'path'],
      };

      const formatted = formatGraphQLError(mockError, null);

      expect(formatted.message).toBe('Test error');
      expect(formatted.extensions?.code).toBe('TEST_CODE');
      expect(formatted.path).toEqual(['test', 'path']);
    });

    it('should handle error with missing extensions', () => {
      const mockError: GraphQLFormattedError = {
        message: 'Test error',
        path: ['test', 'path'],
      };

      const formatted = formatGraphQLError(mockError, null);

      expect(formatted.message).toBe('Test error');
      expect(formatted.extensions?.code).toBeUndefined();
      expect(formatted.path).toEqual(['test', 'path']);
    });

    it('should handle error with missing path', () => {
      const mockError: GraphQLFormattedError = {
        message: 'Test error',
        extensions: { code: 'TEST_CODE' },
      };

      const formatted = formatGraphQLError(mockError, null);

      expect(formatted.message).toBe('Test error');
      expect(formatted.extensions?.code).toBe('TEST_CODE');
      expect(formatted.path).toBeUndefined();
    });

    it('should handle error with missing extensions code', () => {
      const mockError: GraphQLFormattedError = {
        message: 'Test error',
        extensions: {},
        path: ['test'],
      };

      const formatted = formatGraphQLError(mockError, null);

      expect(formatted.message).toBe('Test error');
      expect(formatted.extensions?.code).toBeUndefined();
      expect(formatted.path).toEqual(['test']);
    });

    it('maps graphql-depth-limit depth errors to QUERY_DEPTH_EXCEEDED', () => {
      const mockError: GraphQLFormattedError = {
        message: "foo 'bar' exceeds maximum operation depth of 14",
        extensions: { code: 'GRAPHQL_VALIDATION_FAILED' },
        path: ['q'],
      };

      const formatted = formatGraphQLError(mockError, null);

      expect(formatted.message).toBe(GQL_ERROR_CODES.QUERY_DEPTH_EXCEEDED);
      expect(formatted.extensions?.code).toBe(
        GQL_ERROR_CODES.QUERY_DEPTH_EXCEEDED,
      );
    });

    it('normalizes QUERY_COST_EXCEEDED messages', () => {
      const mockError: GraphQLFormattedError = {
        message: GQL_ERROR_CODES.QUERY_COST_EXCEEDED,
        extensions: { code: 'GRAPHQL_VALIDATION_FAILED' },
        path: ['q'],
      };

      const formatted = formatGraphQLError(mockError, null);

      expect(formatted.message).toBe(GQL_ERROR_CODES.QUERY_COST_EXCEEDED);
      expect(formatted.extensions?.code).toBe(
        GQL_ERROR_CODES.QUERY_COST_EXCEEDED,
      );
    });
  });
});
