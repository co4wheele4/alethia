import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY, Role } from '../decorators/roles.decorator';
import { Request } from 'express';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;
  let mockContext: Partial<ExecutionContext>;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);

    mockContext = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      getType: jest.fn<any, any>(() => 'graphql'),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToHttp: jest.fn(),
      switchToWs: jest.fn(),
    };
  });

  describe('canActivate', () => {
    it('should return true when no roles are required', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      const mockGqlContext = {
        getContext: jest.fn(() => ({
          req: { user: { role: Role.USER } },
        })),
      };

      jest
        .spyOn(GqlExecutionContext, 'create')
        .mockReturnValue(mockGqlContext as unknown as GqlExecutionContext);

      const result = guard.canActivate(mockContext as ExecutionContext);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
        mockContext.getHandler!(),
        mockContext.getClass!(),
      ]);
    });

    it('should return false when user is not present', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);

      const mockGqlContext = {
        getContext: jest.fn(() => ({
          req: {},
        })),
      };

      jest
        .spyOn(GqlExecutionContext, 'create')
        .mockReturnValue(mockGqlContext as unknown as GqlExecutionContext);

      const result = guard.canActivate(mockContext as ExecutionContext);

      expect(result).toBe(false);
    });

    it('should return false when user is undefined', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);

      const mockGqlContext = {
        getContext: jest.fn(() => ({
          req: { user: undefined },
        })),
      };

      jest
        .spyOn(GqlExecutionContext, 'create')
        .mockReturnValue(mockGqlContext as unknown as GqlExecutionContext);

      const result = guard.canActivate(mockContext as ExecutionContext);

      expect(result).toBe(false);
    });

    it('should return true when user has required role', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);

      const mockGqlContext = {
        getContext: jest.fn(() => ({
          req: { user: { role: Role.ADMIN } },
        })),
      };

      jest
        .spyOn(GqlExecutionContext, 'create')
        .mockReturnValue(mockGqlContext as unknown as GqlExecutionContext);

      const result = guard.canActivate(mockContext as ExecutionContext);

      expect(result).toBe(true);
    });

    it('should return true when user has one of multiple required roles', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([Role.ADMIN, Role.USER]);

      const mockGqlContext = {
        getContext: jest.fn(() => ({
          req: { user: { role: Role.USER } },
        })),
      };

      jest
        .spyOn(GqlExecutionContext, 'create')
        .mockReturnValue(mockGqlContext as unknown as GqlExecutionContext);

      const result = guard.canActivate(mockContext as ExecutionContext);

      expect(result).toBe(true);
    });

    it('should return false when user does not have required role', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);

      const mockGqlContext = {
        getContext: jest.fn(() => ({
          req: { user: { role: Role.USER } },
        })),
      };

      jest
        .spyOn(GqlExecutionContext, 'create')
        .mockReturnValue(mockGqlContext as unknown as GqlExecutionContext);

      const result = guard.canActivate(mockContext as ExecutionContext);

      expect(result).toBe(false);
    });

    it('should return false when user role is undefined', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);

      const mockGqlContext = {
        getContext: jest.fn(() => ({
          req: { user: { role: undefined } },
        })),
      };

      jest
        .spyOn(GqlExecutionContext, 'create')
        .mockReturnValue(mockGqlContext as unknown as GqlExecutionContext);

      const result = guard.canActivate(mockContext as ExecutionContext);

      expect(result).toBe(false);
    });

    it('should handle req being undefined', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);

      const mockGqlContext = {
        getContext: jest.fn(() => ({
          req: undefined,
        })),
      };

      jest
        .spyOn(GqlExecutionContext, 'create')
        .mockReturnValue(mockGqlContext as unknown as GqlExecutionContext);

      const result = guard.canActivate(mockContext as ExecutionContext);

      expect(result).toBe(false);
    });
  });
});
