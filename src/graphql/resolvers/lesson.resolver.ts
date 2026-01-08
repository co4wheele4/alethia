import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { UseGuards, Scope, Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { Lesson } from '@models/lesson.model';
import { User } from '@models';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { DataLoaderService } from '@common/dataloaders/dataloader.service';

@Injectable({ scope: Scope.REQUEST })
@Resolver(() => Lesson)
@UseGuards(JwtAuthGuard)
export class LessonResolver {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dataLoaders: DataLoaderService,
  ) {}

  @Query(() => [Lesson])
  async lessons() {
    return this.prisma.lesson.findMany();
  }

  @Query(() => Lesson, { nullable: true })
  async lesson(@Args('id') id: string) {
    return this.prisma.lesson.findUnique({ where: { id } });
  }

  @Query(() => [Lesson])
  async lessonsByUser(@Args('userId') userId: string) {
    return this.prisma.lesson.findMany({ where: { userId } });
  }

  @Mutation(() => Lesson)
  async createLesson(
    @Args('title') title: string,
    @Args('userId') userId: string,
    @Args('content', { nullable: true }) content?: string,
  ) {
    return this.prisma.lesson.create({ data: { title, content, userId } });
  }

  @Mutation(() => Lesson)
  async updateLesson(
    @Args('id') id: string,
    @Args('title', { nullable: true }) title?: string,
    @Args('content', { nullable: true }) content?: string,
  ) {
    return this.prisma.lesson.update({
      where: { id },
      data: { title, content },
    });
  }

  @Mutation(() => Lesson)
  async deleteLesson(@Args('id') id: string) {
    return this.prisma.lesson.delete({ where: { id } });
  }

  @ResolveField(() => User)
  async user(@Parent() lesson: Lesson) {
    // Access userId from the database field, not the GraphQL field
    const lessonWithUserId = lesson as unknown as { userId: string };
    return this.dataLoaders.getUserLoader().load(lessonWithUserId.userId);
  }
}
