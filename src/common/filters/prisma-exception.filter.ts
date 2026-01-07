import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { GqlArgumentsHost, GqlExceptionFilter } from '@nestjs/graphql';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Request, Response } from 'express';

interface GraphQLContext {
  req: Request;
  res?: Response;
}

@Catch(PrismaClientKnownRequestError)
export class PrismaExceptionFilter
  implements ExceptionFilter, GqlExceptionFilter
{
  catch(exception: PrismaClientKnownRequestError, host: ArgumentsHost) {
    const gqlHost = GqlArgumentsHost.create(host);
    const ctx = gqlHost.getContext<GraphQLContext>();

    let error: Error;
    let status = HttpStatus.INTERNAL_SERVER_ERROR;

    switch (exception.code) {
      case 'P2002': {
        // Unique constraint violation
        const target = exception.meta?.target as string[] | undefined;
        const field = target?.[0] || 'field';
        error = new ConflictException(
          `A record with this ${field} already exists.`,
        );
        status = HttpStatus.CONFLICT;
        break;
      }

      case 'P2003':
        // Foreign key constraint violation
        error = new BadRequestException(
          'Invalid reference: The related record does not exist.',
        );
        status = HttpStatus.BAD_REQUEST;
        break;

      case 'P2025':
        // Record not found
        error = new NotFoundException('The requested record was not found.');
        status = HttpStatus.NOT_FOUND;
        break;

      default:
        error = new Error(
          `Database error: ${exception.message || 'Unknown error'}`,
        );
    }

    // For GraphQL, throw the error directly
    if (gqlHost.getInfo()) {
      throw error;
    }

    // For HTTP, return proper response
    const response = ctx.res;
    if (response) {
      response.status(status).json({
        statusCode: status,
        message: error.message,
        error: error.constructor.name,
      });
    }

    return error;
  }
}
