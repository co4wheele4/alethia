import { Args, Context, ID, Query, Resolver } from '@nestjs/graphql';
import { Injectable, Scope, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { PrismaService } from '@prisma/prisma.service';
import { EvidenceReproCheck } from '@models/evidence-repro-check.model';
import { getGqlAuthUserId } from '../utils/gql-auth-user';
import { contractError, GQL_ERROR_CODES } from '../errors/graphql-error-codes';

type GqlContext = {
  req?: { user?: { sub?: string; id?: string } };
};

const evidenceReproCheckListType = () => [EvidenceReproCheck];
void evidenceReproCheckListType();

@Injectable({ scope: Scope.REQUEST })
@Resolver()
@UseGuards(JwtAuthGuard)
export class EvidenceReproResolver {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Read-only history of mechanical reproducibility checks for one evidence row.
   */
  @Query(evidenceReproCheckListType, {
    description:
      'ADR-026: List reproducibility check records for evidence (read-only).',
  })
  async evidenceReproChecks(
    @Args('evidenceId', { type: () => ID }) evidenceId: string,
    @Context() ctx?: GqlContext,
  ) {
    const userId = getGqlAuthUserId(ctx);
    if (!userId) throw contractError(GQL_ERROR_CODES.UNAUTHORIZED);

    const ev = await this.prisma.evidence.findFirst({
      where: {
        id: evidenceId,
        OR: [{ createdBy: userId }, { sourceDocument: { userId } }],
      },
      select: { id: true },
    });
    if (!ev) {
      throw contractError(GQL_ERROR_CODES.EVIDENCE_NOT_FOUND);
    }

    return this.prisma.evidenceReproCheck.findMany({
      where: { evidenceId },
      orderBy: [{ checkedAt: 'desc' }, { id: 'desc' }],
    });
  }
}
