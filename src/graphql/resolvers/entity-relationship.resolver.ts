import {
  Args,
  Query,
  Resolver,
  ResolveField,
  Parent,
  Mutation,
} from '@nestjs/graphql';
import { PrismaService } from '@prisma/prisma.service';
import { EntityRelationship } from '@models/entity-relationship.model';
import { Entity } from '@models/entity.model';
import {
  CreateEntityRelationshipInput,
  UpdateEntityRelationshipInput,
} from '@inputs/entity-relationship.input';

@Resolver(() => EntityRelationship)
export class EntityRelationshipResolver {
  constructor(private readonly prisma: PrismaService) {}

  @Query(() => [EntityRelationship])
  async entityRelationships() {
    return this.prisma.entityRelationship.findMany();
  }

  @Query(() => EntityRelationship, { nullable: true })
  async entityRelationship(@Args('id') id: string) {
    return this.prisma.entityRelationship.findUnique({ where: { id } });
  }

  @ResolveField(() => Entity)
  async from(@Parent() rel: EntityRelationship) {
    // Access fromEntity from the database field, not the GraphQL field
    const relWithFromEntity = rel as unknown as { fromEntity: string };
    return this.prisma.entity.findUnique({
      where: { id: relWithFromEntity.fromEntity },
    });
  }

  @ResolveField(() => Entity)
  async to(@Parent() rel: EntityRelationship) {
    // Access toEntity from the database field, not the GraphQL field
    const relWithToEntity = rel as unknown as { toEntity: string };
    return this.prisma.entity.findUnique({
      where: { id: relWithToEntity.toEntity },
    });
  }

  // ------------------
  // Mutations
  // ------------------

  @Mutation(() => EntityRelationship)
  async createEntityRelationship(
    @Args('data') data: CreateEntityRelationshipInput,
  ) {
    return this.prisma.entityRelationship.create({ data });
  }

  @Mutation(() => EntityRelationship)
  async updateEntityRelationship(
    @Args('data') data: UpdateEntityRelationshipInput,
  ) {
    const { id, fromEntity, toEntity, relation } = data;
    return this.prisma.entityRelationship.update({
      where: { id },
      data: { fromEntity, toEntity, relation },
    });
  }

  @Mutation(() => EntityRelationship)
  async deleteEntityRelationship(@Args('id') id: string) {
    return this.prisma.entityRelationship.delete({ where: { id } });
  }
}
