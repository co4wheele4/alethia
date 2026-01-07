import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Request, Response } from 'express';

interface GraphQLContext {
  req: Request;
  res?: Response;
}

@Injectable()
export class GraphQLThrottlerGuard extends ThrottlerGuard {
  getRequestResponse(context: ExecutionContext): {
    req: Request;
    res: Response;
  } {
    const gqlCtx = GqlExecutionContext.create(context);
    const ctx = gqlCtx.getContext<GraphQLContext>();

    // For GraphQL, return the request/response from context
    if (ctx?.req && ctx?.res) {
      return { req: ctx.req, res: ctx.res };
    }

    // For REST endpoints, use default behavior
    return super.getRequestResponse(context) as { req: Request; res: Response };
  }

  protected getTracker(req: Request): Promise<string> {
    // Use IP address or a default identifier
    return Promise.resolve(req.ip || req.socket?.remoteAddress || 'unknown');
  }
}
