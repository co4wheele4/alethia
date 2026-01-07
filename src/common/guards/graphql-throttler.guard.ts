import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class GraphQLThrottlerGuard extends ThrottlerGuard {
  getRequestResponse(context: ExecutionContext) {
    const gqlCtx = GqlExecutionContext.create(context);
    const ctx = gqlCtx.getContext();

    // For GraphQL, return the request/response from context
    if (ctx?.req && ctx?.res) {
      return { req: ctx.req, res: ctx.res };
    }

    // For REST endpoints, use default behavior
    return super.getRequestResponse(context);
  }

  protected getTracker(req: Record<string, any>): Promise<string> {
    // Use IP address or a default identifier
    return Promise.resolve(
      req.ip || req.connection?.remoteAddress || 'unknown',
    );
  }
}
