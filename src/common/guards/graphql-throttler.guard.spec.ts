import { ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Reflector } from '@nestjs/core';
import { GraphQLThrottlerGuard } from './graphql-throttler.guard';
import { Request, Response } from 'express';

describe('GraphQLThrottlerGuard', () => {
  let guard: GraphQLThrottlerGuard;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    const mockStorage = {
      getRecord: jest.fn(),
      addRecord: jest.fn(),
    };
    guard = new GraphQLThrottlerGuard(
      { limit: 100, ttl: 60000 } as any,
      mockStorage as any,
      new Reflector(),
    );
    mockRequest = {
      ip: '127.0.0.1',
      socket: {
        remoteAddress: '127.0.0.1',
      } as any,
      headers: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe('getRequestResponse', () => {
    it('should return request/response from GraphQL context when available', () => {
      const mockContext: Partial<ExecutionContext> = {
        getType: jest.fn(() => 'graphql' as any),
        getArgs: jest.fn(),
        getArgByIndex: jest.fn(),
        switchToRpc: jest.fn(),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn(() => mockRequest),
          getResponse: jest.fn(() => mockResponse),
          getNext: jest.fn(),
        }),
        switchToWs: jest.fn(),
      };

      const mockGqlContext = {
        getContext: jest.fn(() => ({
          req: mockRequest,
          res: mockResponse,
        })),
      };

      jest
        .spyOn(GqlExecutionContext, 'create')
        .mockReturnValue(mockGqlContext as unknown as GqlExecutionContext);

      const result = guard.getRequestResponse(mockContext as ExecutionContext);

      expect(result.req).toBe(mockRequest);
      expect(result.res).toBe(mockResponse);
      expect(mockGqlContext.getContext).toHaveBeenCalled();
    });

    it('should fall back to super.getRequestResponse for REST endpoints', () => {
      const mockContext: Partial<ExecutionContext> = {
        getType: jest.fn(() => 'http' as any),
        getArgs: jest.fn(),
        getArgByIndex: jest.fn(),
        switchToRpc: jest.fn(),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn(() => mockRequest),
          getResponse: jest.fn(() => mockResponse),
          getNext: jest.fn(),
        }),
        switchToWs: jest.fn(),
      };

      const mockGqlContext = {
        getContext: jest.fn(() => ({
          req: undefined, // No req in context
          res: undefined,
        })),
      };

      jest
        .spyOn(GqlExecutionContext, 'create')
        .mockReturnValue(mockGqlContext as unknown as GqlExecutionContext);

      // Create a spy on the parent class method
      const parentPrototype = Object.getPrototypeOf(GraphQLThrottlerGuard.prototype);
      const originalMethod = parentPrototype.getRequestResponse;
      const superGetRequestResponse = jest
        .spyOn(parentPrototype, 'getRequestResponse')
        .mockReturnValue({ req: mockRequest, res: mockResponse } as any);

      const result = guard.getRequestResponse(mockContext as ExecutionContext);

      expect(result.req).toBe(mockRequest);
      expect(result.res).toBe(mockResponse);
      expect(superGetRequestResponse).toHaveBeenCalledWith(mockContext);

      // Restore original method
      parentPrototype.getRequestResponse = originalMethod;
    });
  });

  describe('getRequestResponse edge cases', () => {
    it('should fall back to super when req exists but res does not', () => {
      const mockContext: Partial<ExecutionContext> = {
        getType: jest.fn(() => 'graphql' as any),
        getArgs: jest.fn(),
        getArgByIndex: jest.fn(),
        switchToRpc: jest.fn(),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn(() => mockRequest),
          getResponse: jest.fn(() => mockResponse),
          getNext: jest.fn(),
        }),
        switchToWs: jest.fn(),
      };

      const mockGqlContext = {
        getContext: jest.fn(() => ({
          req: mockRequest,
          res: undefined, // res is missing
        })),
      };

      jest
        .spyOn(GqlExecutionContext, 'create')
        .mockReturnValue(mockGqlContext as unknown as GqlExecutionContext);

      const parentPrototype = Object.getPrototypeOf(GraphQLThrottlerGuard.prototype);
      const originalMethod = parentPrototype.getRequestResponse;
      const superGetRequestResponse = jest
        .spyOn(parentPrototype, 'getRequestResponse')
        .mockReturnValue({ req: mockRequest, res: mockResponse } as any);

      const result = guard.getRequestResponse(mockContext as ExecutionContext);

      expect(result.req).toBe(mockRequest);
      expect(result.res).toBe(mockResponse);
      expect(superGetRequestResponse).toHaveBeenCalled();

      parentPrototype.getRequestResponse = originalMethod;
    });

    it('should fall back to super when req does not exist', () => {
      const mockContext: Partial<ExecutionContext> = {
        getType: jest.fn(() => 'graphql' as any),
        getArgs: jest.fn(),
        getArgByIndex: jest.fn(),
        switchToRpc: jest.fn(),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn(() => mockRequest),
          getResponse: jest.fn(() => mockResponse),
          getNext: jest.fn(),
        }),
        switchToWs: jest.fn(),
      };

      const mockGqlContext = {
        getContext: jest.fn(() => ({
          req: undefined, // req is missing
          res: mockResponse,
        })),
      };

      jest
        .spyOn(GqlExecutionContext, 'create')
        .mockReturnValue(mockGqlContext as unknown as GqlExecutionContext);

      const parentPrototype = Object.getPrototypeOf(GraphQLThrottlerGuard.prototype);
      const originalMethod = parentPrototype.getRequestResponse;
      const superGetRequestResponse = jest
        .spyOn(parentPrototype, 'getRequestResponse')
        .mockReturnValue({ req: mockRequest, res: mockResponse } as any);

      const result = guard.getRequestResponse(mockContext as ExecutionContext);

      expect(result.req).toBe(mockRequest);
      expect(result.res).toBe(mockResponse);
      expect(superGetRequestResponse).toHaveBeenCalled();

      parentPrototype.getRequestResponse = originalMethod;
    });
  });

  describe('getTracker', () => {
    it('should return IP address from request', async () => {
      const request = {
        ip: '192.168.1.1',
        socket: { remoteAddress: '127.0.0.1' },
      } as any;

      // Access protected method through prototype
      const result = await (guard as any).getTracker(request);

      expect(result).toBe('192.168.1.1');
    });

    it('should return socket remote address when IP not available', async () => {
      const request = {
        socket: { remoteAddress: '10.0.0.1' },
      } as any;

      const result = await (guard as any).getTracker(request);

      expect(result).toBe('10.0.0.1');
    });

    it('should return "unknown" when no IP or socket address', async () => {
      const request = {} as any;

      const result = await (guard as any).getTracker(request);

      expect(result).toBe('unknown');
    });

    it('should return "unknown" when socket exists but no remoteAddress', async () => {
      const request = {
        socket: {},
      } as any;

      const result = await (guard as any).getTracker(request);

      expect(result).toBe('unknown');
    });
  });
});

