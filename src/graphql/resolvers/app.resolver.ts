import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { PrismaService } from '../../prisma/prisma.service';
import { OpenAIService } from '../../openai/openai.service';
import { Lesson } from '@models/lesson.model';

@Resolver()
export class AppResolver {
  constructor(
    private readonly prisma: PrismaService,
    private readonly openai: OpenAIService,
  ) {}

  @Query(() => String)
  hello() {
    return 'Hello, Aletheia!';
  }

  @Query(() => [Lesson])
  async lessons() {
    return this.prisma.lesson.findMany();
  }

  @Mutation(() => String)
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
