import { ID, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { Injectable, Scope, UseGuards } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { ClaimEvidence } from '@models/claim-evidence.model';

function failInvariant(message: string): never {
  // Contract violation: treat as defect, not as soft UI state.
  throw new Error(message);
}

@Injectable({ scope: Scope.REQUEST })
@Resolver(() => ClaimEvidence)
@UseGuards(JwtAuthGuard)
export class ClaimEvidenceResolver {
  constructor(private readonly prisma: PrismaService) {}

  private async loadIds(evidenceId: string) {
    const [mentionLinks, relLinks] = await Promise.all([
      this.prisma.claimEvidenceMention.findMany({
        where: { evidenceId },
        select: { mentionId: true },
        orderBy: [{ mentionId: 'asc' }],
      }),
      this.prisma.claimEvidenceRelationship.findMany({
        where: { evidenceId },
        select: { relationshipId: true },
        orderBy: [{ relationshipId: 'asc' }],
      }),
    ]);

    const mentionIds = mentionLinks.map((l) => l.mentionId);
    const relationshipIds = relLinks.map((l) => l.relationshipId);
    if (mentionIds.length === 0 && relationshipIds.length === 0) {
      failInvariant(
        `Claim contract violation: ClaimEvidence(${evidenceId}) must reference mentionIds and/or relationshipIds`,
      );
    }

    return { mentionIds, relationshipIds };
  }

  @ResolveField(() => [ID])
  async mentionIds(@Parent() evidence: ClaimEvidence) {
    const { mentionIds } = await this.loadIds(evidence.id);
    return mentionIds;
  }

  @ResolveField(() => [ID])
  async relationshipIds(@Parent() evidence: ClaimEvidence) {
    const { relationshipIds } = await this.loadIds(evidence.id);
    return relationshipIds;
  }
}
