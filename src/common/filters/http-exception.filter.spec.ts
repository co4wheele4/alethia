import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { GqlArgumentsHost } from '@nestjs/graphql';
import { HttpExceptionFilter } from './http-exception.filter';
import { Response } from 'express';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe('catch', () => {
    it('should throw exception directly for GraphQL context', () => {
      const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST);
      const mockContext: Partial<ArgumentsHost> = {
        getType: jest.fn(() => 'graphql' as any),
        getArgs: jest.fn(),
        getArgByIndex: jest.fn(),
        switchToRpc: jest.fn(),
        switchToHttp: jest.fn(),
        switchToWs: jest.fn(),
      };

      const mockGqlContext = {
        getInfo: jest.fn(() => ({})), // Returns truthy value for GraphQL
      };

      jest
        .spyOn(GqlArgumentsHost, 'create')
        .mockReturnValue(mockGqlContext as unknown as GqlArgumentsHost);

      expect(() => filter.catch(exception, mockContext as ArgumentsHost)).toThrow(
        HttpException,
      );
    });

    it('should return JSON response for HTTP context', () => {
      const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST);
      const mockContext: Partial<ArgumentsHost> = {
        getType: jest.fn(() => 'http' as any),
        switchToHttp: jest.fn(() => ({
          getResponse: jest.fn(() => mockResponse),
          getRequest: jest.fn(),
          getNext: jest.fn(),
        })) as any,
        getArgs: jest.fn(),
        getArgByIndex: jest.fn(),
        switchToRpc: jest.fn(),
        switchToWs: jest.fn(),
      };

      const mockGqlContext = {
        getInfo: jest.fn(() => null), // Returns falsy for HTTP
      };

      jest
        .spyOn(GqlArgumentsHost, 'create')
        .mockReturnValue(mockGqlContext as unknown as GqlArgumentsHost);

      filter.catch(exception, mockContext as ArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
          timestamp: expect.any(String),
        }),
      );
    });

    it('should handle exception with object response', () => {
      const exception = new HttpException(
        { message: 'Custom error', code: 'CUSTOM_ERROR' },
        HttpStatus.BAD_REQUEST,
      );
      const mockContext: Partial<ArgumentsHost> = {
        getType: jest.fn(() => 'http' as any),
        switchToHttp: jest.fn(() => ({
          getResponse: jest.fn(() => mockResponse),
          getRequest: jest.fn(),
          getNext: jest.fn(),
        })) as any,
        getArgs: jest.fn(),
        getArgByIndex: jest.fn(),
        switchToRpc: jest.fn(),
        switchToWs: jest.fn(),
      };

      const mockGqlContext = {
        getInfo: jest.fn(() => null),
      };

      jest
        .spyOn(GqlArgumentsHost, 'create')
        .mockReturnValue(mockGqlContext as unknown as GqlArgumentsHost);

      filter.catch(exception, mockContext as ArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Custom error',
          code: 'CUSTOM_ERROR',
        }),
      );
    });

    it('should use default status when exception has no status', () => {
      // Create a mock exception without getStatus method returning a value
      const exception = {
        getStatus: jest.fn(() => undefined),
        getResponse: jest.fn(() => 'Test error'),
      } as unknown as HttpException;

      const mockContext: Partial<ArgumentsHost> = {
        getType: jest.fn(() => 'http' as any),
        switchToHttp: jest.fn(() => ({
          getResponse: jest.fn(() => mockResponse),
          getRequest: jest.fn(),
          getNext: jest.fn(),
        })) as any,
        getArgs: jest.fn(),
        getArgByIndex: jest.fn(),
        switchToRpc: jest.fn(),
        switchToWs: jest.fn(),
      };

      const mockGqlContext = {
        getInfo: jest.fn(() => null),
      };

      jest
        .spyOn(GqlArgumentsHost, 'create')
        .mockReturnValue(mockGqlContext as unknown as GqlArgumentsHost);

      filter.catch(exception, mockContext as ArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    });

    it('should handle exception with string response', () => {
      const exception = new HttpException('Simple string error', HttpStatus.BAD_REQUEST);
      const mockContext: Partial<ArgumentsHost> = {
        getType: jest.fn(() => 'http' as any),
        switchToHttp: jest.fn(() => ({
          getResponse: jest.fn(() => mockResponse),
          getRequest: jest.fn(),
          getNext: jest.fn(),
        })) as any,
        getArgs: jest.fn(),
        getArgByIndex: jest.fn(),
        switchToRpc: jest.fn(),
        switchToWs: jest.fn(),
      };

      const mockGqlContext = {
        getInfo: jest.fn(() => null),
      };

      jest
        .spyOn(GqlArgumentsHost, 'create')
        .mockReturnValue(mockGqlContext as unknown as GqlArgumentsHost);

      filter.catch(exception, mockContext as ArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Simple string error',
        }),
      );
    });
  });
});

