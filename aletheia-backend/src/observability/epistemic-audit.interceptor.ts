import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { EpistemicEventType } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';
import { logEpistemicEvent } from './logEpistemicEvent';
import { GQL_ERROR_CODES } from '../graphql/errors/graphql-error-codes';

/** Contract errors that warrant an epistemic audit row (ADR-029). */
const AUDITED_CODES = new Set<string>([
  GQL_ERROR_CODES.DERIVED_SEMANTICS_FORBIDDEN,
  GQL_ERROR_CODES.EVIDENCE_REQUIRED_FOR_ADJUDICATION,
  GQL_ERROR_CODES.INVALID_LIFECYCLE_TRANSITION,
  GQL_ERROR_CODES.CLAIM_NOT_EVIDENCE_CLOSED,
  GQL_ERROR_CODES.REVIEW_QUORUM_NOT_MET,
  GQL_ERROR_CODES.BUNDLE_VALIDATION_FAILED,
  GQL_ERROR_CODES.IMPORT_COLLISION,
]);

@Injectable()
export class EpistemicAuditInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType<string>() !== 'graphql') {
      return next.handle();
    }

    return next.handle().pipe(
      catchError((err: unknown) => {
        if (err instanceof GraphQLError) {
          const code = err.extensions?.code;
          if (typeof code === 'string' && AUDITED_CODES.has(code)) {
            const gqlCtx = GqlExecutionContext.create(context);
            const req = gqlCtx.getContext<{
              req?: { user?: { sub?: string; id?: string } };
            }>().req;
            const actorId = req?.user?.sub ?? req?.user?.id ?? null;
            void logEpistemicEvent(this.prisma, {
              eventType: EpistemicEventType.GOVERNANCE_GRAPHQL_ERROR,
              actorId,
              targetId: null,
              errorCode: code,
              metadata: { path: err.path ?? null },
            }).catch(() => {
              /* avoid throwing from audit path */
            });
          }
        }
        return throwError(() => err);
      }),
    );
  }
}
