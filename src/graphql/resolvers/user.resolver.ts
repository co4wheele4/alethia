import { Args, Mutation, Query, Resolver, ResolveField, Parent } from '@nestjs/graphql';
import { User } from '@models/user.model';
import { PrismaService } from '@prisma/prisma.service';
import { Lesson } from '@models/lesson.model';
import { Document } from '@models/document.model';
import { AiQuery } from '@models/ai-query.model';
import { CreateUserInput, UpdateUserInput } from '@inputs/user.input';

@Resolver(() => User)
export class UserResolver {
  constructor(private readonly prisma: PrismaService) {}

  @Query(() => [User])
  async users() {
    return this.prisma.user.findMany();
  }

  @Query(() => User, { nullable: true })
  async user(@Args('id') id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  @Mutation(() => User)
  async createUser(@Args('data') data: CreateUserInput) {
    return this.prisma.user.create({ data });
  }

  @Mutation(() => User)
  async updateUser(@Args('data') data: UpdateUserInput) {
    const { id, ...updateData } = data;
    return this.prisma.user.update({ where: { id }, data: updateData });
  }

  @Mutation(() => User)
  async deleteUser(@Args('id') id: string) {
    return this.prisma.user.delete({ where: { id } });
  }

  @ResolveField(() => [Lesson])
  async lessons(@Parent() user: User) {
    return this.prisma.user.findUnique({ where: { id: user.id } }).lessons();
  }

  @ResolveField(() => [Document])
  async documents(@Parent() user: User) {
    return this.prisma.user.findUnique({ where: { id: user.id } }).documents();
  }

  @ResolveField(() => [AiQuery])
  async aiQueries(@Parent() user: User) {
    return this.prisma.user.findUnique({ where: { id: user.id } }).aiQueries();
  }
}
