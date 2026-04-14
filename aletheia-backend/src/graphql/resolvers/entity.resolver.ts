import {
  Args,
  Query,
  Resolver,
  ResolveField,
  Parent,
  Mutation,
  Int,
} from '@nestjs/graphql';
import { UseGuards, Scope, Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { Entity } from '@models/entity.model';
import { EntityMention } from '@models/entity-mention.model';
import { EntityRelationship } from '@models/entity-relationship.model';
import { CreateEntityInput, UpdateEntityInput } from '@inputs/entity.input';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { DataLoaderService } from '@common/dataloaders/dataloader.service';

const entityType = () => Entity;
const entityListType = () => [Entity];
const entityMentionListType = () => [EntityMention];
const entityRelationshipListType = () => [EntityRelationship];
const intFieldType = () => Int;
void entityType();
void entityListType();
void entityMentionListType();
void entityRelationshipListType();
void intFieldType();

@Injectable({ scope: Scope.REQUEST })
@Resolver(entityType)
@UseGuards(JwtAuthGuard)
export class EntityResolver {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dataLoaders: DataLoaderService,
  ) {}

  @Query(entityListType)
  async entities() {
    return await this.prisma.entity.findMany();
  }

  @Query(entityType, { nullable: true })
  async entity(@Args('id') id: string) {
    return await this.prisma.entity.findUnique({ where: { id } });
  }

  @ResolveField(entityMentionListType)
  async mentions(@Parent() entity: Entity) {
    return this.dataLoaders.getMentionsByEntityLoader().load(entity.id);
  }

  @ResolveField(intFieldType)
  async mentionCount(@Parent() entity: Entity) {
    return this.dataLoaders.getMentionCountByEntityLoader().load(entity.id);
  }

  @ResolveField(entityRelationshipListType)
  async outgoing(@Parent() entity: Entity) {
    return this.dataLoaders
      .getRelationshipsByFromEntityLoader()
      .load(entity.id);
  }

  @ResolveField(entityRelationshipListType)
  async incoming(@Parent() entity: Entity) {
    return this.dataLoaders.getRelationshipsByToEntityLoader().load(entity.id);
  }

  // ------------------
  // Mutations
  // ------------------

  @Mutation(entityType)
  async createEntity(@Args('data') data: CreateEntityInput) {
    return await this.prisma.entity.create({ data });
  }

  @Mutation(entityType)
  async updateEntity(@Args('data') data: UpdateEntityInput) {
    return await this.prisma.entity.update({
      where: { id: data.id },
      data: { name: data.name, type: data.type },
    });
  }

  @Mutation(entityType)
  async deleteEntity(@Args('id') id: string) {
    return await this.prisma.entity.delete({ where: { id } });
  }
}
