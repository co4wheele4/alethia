import { Args, Query, Resolver } from '@nestjs/graphql';
import { Injectable, Scope, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { RolesGuard } from '@auth/guards/roles.guard';
import { Roles, Role } from '@auth/decorators/roles.decorator';
import { PrismaService } from '@prisma/prisma.service';
import {
  EpistemicEvent,
  prismaEpistemicEventTypeToGql,
} from '@models/epistemic-event.model';
import { EpistemicEventFilterInput } from '@inputs/epistemic-event-filter.input';
import { Prisma } from '@prisma/client';

const epistemicEventListType = () => [EpistemicEvent];
void epistemicEventListType();

@Injectable({ scope: Scope.REQUEST })
@Resolver()
export class EpistemicEventsResolver {
  constructor(private readonly prisma: PrismaService) {}

  @Query(epistemicEventListType, {
    description: 'ADR-029: Admin audit listing (structural filters only).',
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async adminEpistemicEvents(
    @Args('filter', { nullable: true }) filter?: EpistemicEventFilterInput,
  ) {
    const where: Prisma.EpistemicEventWhereInput = {};
    if (filter?.errorCode) where.errorCode = filter.errorCode;
    if (filter?.createdAfter || filter?.createdBefore) {
      where.createdAt = {};
      if (filter.createdAfter) where.createdAt.gte = filter.createdAfter;
      if (filter.createdBefore) where.createdAt.lte = filter.createdBefore;
    }

    const rows = await this.prisma.epistemicEvent.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });

    return rows.map((r) => ({
      ...r,
      eventType: prismaEpistemicEventTypeToGql(r.eventType),
    })) as EpistemicEvent[];
  }
}
