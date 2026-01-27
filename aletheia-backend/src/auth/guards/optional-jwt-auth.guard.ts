import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { Response } from 'express';

interface GraphQLContext {
  req: Request;
  res?: Response;
}

/**
 * Optional JWT auth for GraphQL.
 *
 * Why:
 * - Some resolvers enforce their own explicit contract errors (e.g. UNAUTHORIZED_REVIEWER)
 * - The default JwtAuthGuard throws before the resolver can emit a stable error code.
 *
 * Behavior:
 * - If a valid bearer token is present, req.user is populated (passport-jwt strategy).
 * - If missing/invalid, the request continues with req.user undefined.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext): Request {
    const ctx = GqlExecutionContext.create(context);
    const gqlContext = ctx.getContext<GraphQLContext>();
    return gqlContext.req;
  }

  handleRequest<TUser = unknown>(
    err: unknown,
    user: TUser | null,
    info: unknown,
    context: ExecutionContext,
    status?: unknown,
  ): TUser {
    // Never throw here; resolver will emit contract-specific error codes.
    void err;
    void info;
    void context;
    void status;
    return (user ?? null) as unknown as TUser;
  }
}
