import { Request, Response } from 'express';
import { GraphQLFormattedError } from 'graphql';
import { GQL_ERROR_CODES } from '../graphql/errors/graphql-error-codes';

/**
 * GraphQL context function - extracts request and response from GraphQL context
 */
export function createGraphQLContext({
  req,
  res,
}: {
  req: Request;
  res: Response;
}) {
  return {
    req,
    res,
  };
}

/**
 * GraphQL error formatter - formats GraphQL errors for client responses
 */
export function formatGraphQLError(
  formattedError: GraphQLFormattedError,
  originalError: unknown,
): GraphQLFormattedError {
  const msg = formattedError.message;
  if (
    typeof msg === 'string' &&
    msg.includes('exceeds maximum operation depth')
  ) {
    return {
      message: GQL_ERROR_CODES.QUERY_DEPTH_EXCEEDED,
      extensions: {
        ...formattedError.extensions,
        code: GQL_ERROR_CODES.QUERY_DEPTH_EXCEEDED,
      },
      path: formattedError.path,
    };
  }
  if (msg === GQL_ERROR_CODES.QUERY_COST_EXCEEDED) {
    return {
      message: GQL_ERROR_CODES.QUERY_COST_EXCEEDED,
      extensions: {
        ...formattedError.extensions,
        code: GQL_ERROR_CODES.QUERY_COST_EXCEEDED,
      },
      path: formattedError.path,
    };
  }
  void originalError;
  return {
    message: formattedError.message,
    extensions: {
      ...formattedError.extensions,
      code: formattedError.extensions?.code,
    },
    path: formattedError.path,
  };
}
