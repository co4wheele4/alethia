import { Request, Response } from 'express';
import { GraphQLFormattedError } from 'graphql';

/**
 * GraphQL context function - extracts request and response from GraphQL context
 */
export function createGraphQLContext({ req, res }: { req: Request; res: Response }) {
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
  _error: unknown,
): GraphQLFormattedError {
  return {
    message: formattedError.message,
    extensions: {
      ...formattedError.extensions,
      code: formattedError.extensions?.code,
    },
    path: formattedError.path,
  };
}

