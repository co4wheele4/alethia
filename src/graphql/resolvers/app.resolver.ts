import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OpenAIService } from '../../openai/openai.service';
import { Lesson } from '@models/lesson.model';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';

@Resolver()
export class AppResolver {
  constructor(
    private readonly prisma: PrismaService,
    private readonly openai: OpenAIService,
  ) {}

  @Query(() => String)
  hello() {
    // Public endpoint - no auth required
    return 'Hello, Aletheia!';
  }

  @Query(() => [Lesson])
  @UseGuards(JwtAuthGuard)
  async lessons() {
    return await this.prisma.lesson.findMany();
  }

  @Mutation(() => String)
  @UseGuards(JwtAuthGuard)
  async askAI(@Args('userId') userId: string, @Args('query') query: string) {
    const answer = await this.openai.getEmbeddingResult(query); // ensure getEmbeddingResult exists
    await this.prisma.aiQuery.create({
      data: {
        userId,
        query,
        results: {
          create: {
            answer,
            score: 1,
          },
        },
      },
    });
    return answer;
  }
}
