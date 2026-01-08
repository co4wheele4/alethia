import {
  Args,
  Mutation,
  Query,
  Resolver,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { UseGuards, Scope, Injectable } from '@nestjs/common';
import { User } from '@models/user.model';
import { PrismaService } from '@prisma/prisma.service';
import { Lesson } from '@models/lesson.model';
import { Document } from '@models/document.model';
import { AiQuery } from '@models/ai-query.model';
import { CreateUserInput, UpdateUserInput } from '@inputs/user.input';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { Roles } from '@auth/decorators/roles.decorator';
import { RolesGuard } from '@auth/guards/roles.guard';
import { Role } from '@auth/decorators/roles.decorator';
import { DataLoaderService } from '@common/dataloaders/dataloader.service';

@Injectable({ scope: Scope.REQUEST })
@Resolver(() => User)
@UseGuards(JwtAuthGuard)
export class UserResolver {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dataLoaders: DataLoaderService,
  ) {}

  @Query(() => [User])
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async users() {
    return this.prisma.user.findMany();
  }

  @Query(() => User, { nullable: true })
  async user(@Args('id') id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  @Mutation(() => User)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async createUser(@Args('data') data: CreateUserInput) {
    return this.prisma.user.create({ data });
  }

  @Mutation(() => User)
  async updateUser(@Args('data') data: UpdateUserInput) {
    const { id, ...updateData } = data;
    return this.prisma.user.update({ where: { id }, data: updateData });
  }

  @Mutation(() => User)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async deleteUser(@Args('id') id: string) {
    return this.prisma.user.delete({ where: { id } });
  }

  @ResolveField(() => [Lesson])
  async lessons(@Parent() user: User) {
    return this.dataLoaders.getLessonsByUserLoader().load(user.id);
  }

  @ResolveField(() => [Document])
  async documents(@Parent() user: User) {
    return this.dataLoaders.getDocumentsByUserLoader().load(user.id);
  }

  @ResolveField(() => [AiQuery])
  async aiQueries(@Parent() user: User) {
    return this.dataLoaders.getAiQueriesByUserLoader().load(user.id);
  }
}
