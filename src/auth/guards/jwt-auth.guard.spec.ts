import { ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Request } from 'express';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let mockRequest: Partial<Request>;

  beforeEach(() => {
    guard = new JwtAuthGuard();
    mockRequest = {
      headers: {},
      body: {},
    };
  });

  describe('getRequest', () => {
    it('should return request from GraphQL context', () => {
      const mockContext: Partial<ExecutionContext> = {
        getType: jest.fn(() => 'graphql' as any),
        getArgs: jest.fn(),
        getArgByIndex: jest.fn(),
        switchToRpc: jest.fn(),
        switchToHttp: jest.fn(),
        switchToWs: jest.fn(),
      };

      const mockGqlContext = {
        getContext: jest.fn(() => ({
          req: mockRequest,
        })),
        getInfo: jest.fn(),
        getArgs: jest.fn(),
        getRoot: jest.fn(),
      };

      jest
        .spyOn(GqlExecutionContext, 'create')
        .mockReturnValue(mockGqlContext as unknown as GqlExecutionContext);

      const result = guard.getRequest(mockContext as ExecutionContext);

      expect(result).toBe(mockRequest);
      expect(GqlExecutionContext.create).toHaveBeenCalledWith(mockContext);
      expect(mockGqlContext.getContext).toHaveBeenCalled();
    });
  });
});

