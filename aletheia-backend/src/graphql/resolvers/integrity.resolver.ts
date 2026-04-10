import { Args, Query, Resolver } from '@nestjs/graphql';
import { Injectable, Scope, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { RolesGuard } from '@auth/guards/roles.guard';
import { Roles, Role } from '@auth/decorators/roles.decorator';
import { IntegrityReport } from '@models/integrity-report.model';
import { IntegrityService } from '../../integrity/integrity.service';

const reportType = () => IntegrityReport;
void reportType();

@Injectable({ scope: Scope.REQUEST })
@Resolver()
export class IntegrityResolver {
  constructor(private readonly integrity: IntegrityService) {}

  @Query(reportType, {
    description:
      'ADR-036: Structural integrity validation (hash chain + evidence contentSha256 presence).',
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async validateIntegrity(@Args('workspaceId') workspaceId: string) {
    void workspaceId;
    return this.integrity.validateAdjudicationChain();
  }
}
