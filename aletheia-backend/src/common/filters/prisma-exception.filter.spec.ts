import {
  ArgumentsHost,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { GqlArgumentsHost } from '@nestjs/graphql';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { PrismaExceptionFilter } from './prisma-exception.filter';
import { Response } from 'express';

// Helper to create PrismaClientKnownRequestError
function createPrismaError(
  message: string,
  code: string,
  meta?: Record<string, unknown>,
): PrismaClientKnownRequestError {
  const error = new PrismaClientKnownRequestError(message, {
    code,
    clientVersion: '7.2.0',
    ...(meta && { meta }),
  });
  return error;
}

describe('PrismaExceptionFilter', () => {
  let filter: PrismaExceptionFilter;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    filter = new PrismaExceptionFilter();
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe('catch', () => {
    it('should throw ConflictException for P2002 (unique constraint)', () => {
      const exception = createPrismaError('Unique constraint failed', 'P2002', {
        target: ['email'],
      });

      const mockContext: Partial<ArgumentsHost> = {
        getType: jest.fn<any, any>(() => 'graphql'),
        getArgs: jest.fn(),
        getArgByIndex: jest.fn(),
        switchToRpc: jest.fn(),
        switchToHttp: jest.fn(),
        switchToWs: jest.fn(),
      };

      const mockGqlContext = {
        getContext: jest.fn(() => ({ req: {}, res: mockResponse })),
        getInfo: jest.fn(() => ({})), // GraphQL context
      };

      jest
        .spyOn(GqlArgumentsHost, 'create')
        .mockReturnValue(mockGqlContext as unknown as GqlArgumentsHost);

      expect(() =>
        filter.catch(exception, mockContext as ArgumentsHost),
      ).toThrow(ConflictException);
    });

    it('should throw BadRequestException for P2003 (foreign key)', () => {
      const exception = createPrismaError(
        'Foreign key constraint failed',
        'P2003',
      );

      const mockContext: Partial<ArgumentsHost> = {
        getType: jest.fn<any, any>(() => 'graphql'),
        getArgs: jest.fn(),
        getArgByIndex: jest.fn(),
        switchToRpc: jest.fn(),
        switchToHttp: jest.fn(),
        switchToWs: jest.fn(),
      };

      const mockGqlContext = {
        getContext: jest.fn(() => ({ req: {}, res: mockResponse })),
        getInfo: jest.fn(() => ({})),
      };

      jest
        .spyOn(GqlArgumentsHost, 'create')
        .mockReturnValue(mockGqlContext as unknown as GqlArgumentsHost);

      expect(() =>
        filter.catch(exception, mockContext as ArgumentsHost),
      ).toThrow(BadRequestException);
    });

    it('should throw NotFoundException for P2025 (record not found)', () => {
      const exception = createPrismaError('Record not found', 'P2025');

      const mockContext: Partial<ArgumentsHost> = {
        getType: jest.fn<any, any>(() => 'graphql'),
        getArgs: jest.fn(),
        getArgByIndex: jest.fn(),
        switchToRpc: jest.fn(),
        switchToHttp: jest.fn(),
        switchToWs: jest.fn(),
      };

      const mockGqlContext = {
        getContext: jest.fn(() => ({ req: {}, res: mockResponse })),
        getInfo: jest.fn(() => ({})),
      };

      jest
        .spyOn(GqlArgumentsHost, 'create')
        .mockReturnValue(mockGqlContext as unknown as GqlArgumentsHost);

      expect(() =>
        filter.catch(exception, mockContext as ArgumentsHost),
      ).toThrow(NotFoundException);
    });

    it('should throw generic Error for unknown error codes', () => {
      const exception = createPrismaError('Unknown error', 'P9999');

      const mockContext: Partial<ArgumentsHost> = {
        getType: jest.fn<any, any>(() => 'graphql'),
        getArgs: jest.fn(),
        getArgByIndex: jest.fn(),
        switchToRpc: jest.fn(),
        switchToHttp: jest.fn(),
        switchToWs: jest.fn(),
      };

      const mockGqlContext = {
        getContext: jest.fn(() => ({ req: {}, res: mockResponse })),
        getInfo: jest.fn(() => ({})),
      };

      jest
        .spyOn(GqlArgumentsHost, 'create')
        .mockReturnValue(mockGqlContext as unknown as GqlArgumentsHost);

      expect(() =>
        filter.catch(exception, mockContext as ArgumentsHost),
      ).toThrow(Error);
    });

    it('should handle exception with no message', () => {
      const exception = createPrismaError(
        '', // Empty message
        'P9999',
      );

      const mockContext: Partial<ArgumentsHost> = {
        getType: jest.fn<any, any>(() => 'graphql'),
        getArgs: jest.fn(),
        getArgByIndex: jest.fn(),
        switchToRpc: jest.fn(),
        switchToHttp: jest.fn(),
        switchToWs: jest.fn(),
      };

      const mockGqlContext = {
        getContext: jest.fn(() => ({ req: {}, res: mockResponse })),
        getInfo: jest.fn(() => ({})),
      };

      jest
        .spyOn(GqlArgumentsHost, 'create')
        .mockReturnValue(mockGqlContext as unknown as GqlArgumentsHost);

      expect(() =>
        filter.catch(exception, mockContext as ArgumentsHost),
      ).toThrow(Error);
    });

    it('should return HTTP response when not GraphQL context', () => {
      const exception = createPrismaError('Unique constraint failed', 'P2002', {
        target: ['email'],
      });

      const mockContext: Partial<ArgumentsHost> = {
        getType: jest.fn<any, any>(() => 'http'),
        getArgs: jest.fn(),
        getArgByIndex: jest.fn(),
        switchToRpc: jest.fn(),
        switchToHttp: jest.fn(),
        switchToWs: jest.fn(),
      };

      const mockGqlContext = {
        getContext: jest.fn(() => ({ req: {}, res: mockResponse })),
        getInfo: jest.fn(() => null), // Not GraphQL
      };

      jest
        .spyOn(GqlArgumentsHost, 'create')
        .mockReturnValue(mockGqlContext as unknown as GqlArgumentsHost);

      filter.catch(exception, mockContext as ArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalled();
    });

    it('should handle P2002 with no target field', () => {
      const exception = createPrismaError(
        'Unique constraint failed',
        'P2002',
        {},
      );

      const mockContext: Partial<ArgumentsHost> = {
        getType: jest.fn<any, any>(() => 'graphql'),
        getArgs: jest.fn(),
        getArgByIndex: jest.fn(),
        switchToRpc: jest.fn(),
        switchToHttp: jest.fn(),
        switchToWs: jest.fn(),
      };

      const mockGqlContext = {
        getContext: jest.fn(() => ({ req: {}, res: mockResponse })),
        getInfo: jest.fn(() => ({})),
      };

      jest
        .spyOn(GqlArgumentsHost, 'create')
        .mockReturnValue(mockGqlContext as unknown as GqlArgumentsHost);

      expect(() =>
        filter.catch(exception, mockContext as ArgumentsHost),
      ).toThrow(ConflictException);
    });
  });
});
