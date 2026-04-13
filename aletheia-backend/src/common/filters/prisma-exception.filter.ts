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
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { Request, Response } from 'express';

interface GraphQLContext {
  req: Request;
  res?: Response;
}

/**
 * Prisma 7 + driver adapters may surface the same failures with a missing/empty
 * `code` while still using PrismaClientKnownRequestError. Map from message/meta
 * so GraphQL returns structured errors (HTTP 200 + errors[]) instead of 500.
 */
function resolvePrismaErrorCode(
  exception: PrismaClientKnownRequestError,
): string {
  const direct = exception.code?.trim();
  if (direct) return direct;
  const blob = `${exception.message}\n${JSON.stringify(exception.meta ?? {})}`;
  if (/duplicate key|unique constraint/i.test(blob)) return 'P2002';
  if (/foreign key constraint/i.test(blob)) return 'P2003';
  return '';
}

function uniqueFieldLabel(exception: PrismaClientKnownRequestError): string {
  const target = exception.meta?.target as string[] | undefined;
  if (target?.length) return target[0] ?? 'field';
  const m = exception.message.match(/unique constraint "([^"]+)"/i);
  if (!m) return 'field';
  const parts = m[1].split('_');
  if (parts.length >= 2) {
    return parts[parts.length - 2] || 'field';
  }
  return 'field';
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

    switch (resolvePrismaErrorCode(exception)) {
      case 'P2002': {
        const field = uniqueFieldLabel(exception);
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
