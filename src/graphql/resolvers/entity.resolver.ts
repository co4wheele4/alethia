import {
  Args,
  Query,
  Resolver,
  ResolveField,
  Parent,
  Mutation,
} from '@nestjs/graphql';
import { UseGuards, Scope, Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { Entity } from '@models/entity.model';
import { EntityMention } from '@models/entity-mention.model';
import { EntityRelationship } from '@models/entity-relationship.model';
import { CreateEntityInput, UpdateEntityInput } from '@inputs/entity.input';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { DataLoaderService } from '@common/dataloaders/dataloader.service';

@Injectable({ scope: Scope.REQUEST })
@Resolver(() => Entity)
@UseGuards(JwtAuthGuard)
export class EntityResolver {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dataLoaders: DataLoaderService,
  ) {}

  @Query(() => [Entity])
  async entities() {
    return this.prisma.entity.findMany();
  }

  @Query(() => Entity, { nullable: true })
  async entity(@Args('id') id: string) {
    return this.prisma.entity.findUnique({ where: { id } });
  }

  @ResolveField(() => [EntityMention])
  async mentions(@Parent() entity: Entity) {
    return this.dataLoaders.getMentionsByEntityLoader().load(entity.id);
  }

  @ResolveField(() => [EntityRelationship])
  async outgoing(@Parent() entity: Entity) {
    return this.dataLoaders.getRelationshipsByFromEntityLoader().load(entity.id);
  }

  @ResolveField(() => [EntityRelationship])
  async incoming(@Parent() entity: Entity) {
    return this.dataLoaders.getRelationshipsByToEntityLoader().load(entity.id);
  }

  // ------------------
  // Mutations
  // ------------------

  @Mutation(() => Entity)
  async createEntity(@Args('data') data: CreateEntityInput) {
    return this.prisma.entity.create({ data });
  }

  @Mutation(() => Entity)
  async updateEntity(@Args('data') data: UpdateEntityInput) {
    return this.prisma.entity.update({
      where: { id: data.id },
      data: { name: data.name, type: data.type },
    });
  }

  @Mutation(() => Entity)
  async deleteEntity(@Args('id') id: string) {
    return this.prisma.entity.delete({ where: { id } });
  }
}
