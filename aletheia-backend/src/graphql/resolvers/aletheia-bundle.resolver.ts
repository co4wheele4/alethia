import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Injectable, Scope, UseGuards } from '@nestjs/common';
import { GraphQLJSON } from 'graphql-scalars';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { RolesGuard } from '@auth/guards/roles.guard';
import { Roles, Role } from '@auth/decorators/roles.decorator';
import { AletheiaBundleService } from '../../bundle/aletheia-bundle.service';
import { ExportBundleInput } from '@inputs/export-bundle.input';
import { ImportBundleInput } from '@inputs/import-bundle.input';
import { ImportResult } from '@models/import-result.model';
import { ClaimStatus } from '@prisma/client';

const exportBundleReturnType = () => GraphQLJSON;
const importBundleReturnType = () => ImportResult;
void exportBundleReturnType();
void importBundleReturnType();

@Injectable({ scope: Scope.REQUEST })
@Resolver()
export class AletheiaBundleResolver {
  constructor(private readonly bundles: AletheiaBundleService) {}

  @Query(exportBundleReturnType, {
    description: 'ADR-031: Structural export (JSON bundle).',
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async exportBundle(@Args('input') input: ExportBundleInput) {
    return this.bundles.exportBundle({
      claimIds: input.claimIds,
      lifecycle: input.lifecycle as ClaimStatus | undefined,
      createdAfter: input.createdAfter,
      createdBefore: input.createdBefore,
      includeEpistemicEvents: input.includeEpistemicEvents,
      epistemicEventsAfter: input.epistemicEventsAfter,
      epistemicEventsBefore: input.epistemicEventsBefore,
    });
  }

  @Mutation(importBundleReturnType, {
    description: 'ADR-031: Structural import (admin only).',
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async importBundle(@Args('input') input: ImportBundleInput) {
    const b =
      input.bundle as import('../../bundle/aletheia-bundle.service').AletheiaBundleRecord;
    return this.bundles.importBundle(b, input.allowOverwrite);
  }
}
