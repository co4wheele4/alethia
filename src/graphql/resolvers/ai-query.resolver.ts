import {
  Args,
  Mutation,
  Parent,
  Query,
  Resolver,
  ResolveField,
  Int,
} from '@nestjs/graphql';
import { PrismaService } from '@prisma/prisma.service';
import { AiQuery, AiQueryResult } from '@models/ai-query.model';
import { User } from '@models/user.model';

@Resolver(() => AiQuery)
export class AiQueryResolver {
  constructor(private readonly prisma: PrismaService) {}

  // ---------- BASE QUERIES ----------

  @Query(() => [AiQuery])
  async aiQueries() {
    return this.prisma.aiQuery.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  @Query(() => AiQuery, { nullable: true })
  async aiQuery(@Args('id') id: string) {
    return this.prisma.aiQuery.findUnique({
      where: { id },
    });
  }

  @Query(() => [AiQuery])
  async aiQueriesByUser(@Args('userId') userId: string) {
    return this.prisma.aiQuery.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Query(() => [AiQuery])
  async aiQueriesPaged(
    @Args('skip', { type: () => Int, nullable: true }) skip = 0,
    @Args('take', { type: () => Int, nullable: true }) take = 20,
  ) {
    // Validate skip and take values
    const validatedSkip = Math.max(0, skip ?? 0);
    const validatedTake = Math.max(0, take ?? 20);
    
    return this.prisma.aiQuery.findMany({
      skip: validatedSkip,
      take: validatedTake,
      orderBy: { createdAt: 'desc' },
    });
  }
  // ---------- MUTATION ----------

  @Mutation(() => AiQueryResult)
  async askAi(@Args('userId') userId: string, @Args('query') query: string) {
    const aiQuery = await this.prisma.aiQuery.create({
      data: {
        userId,
        query,
      },
    });

    // placeholder – OpenAI integration later
    return this.prisma.aiQueryResult.create({
      data: {
        queryId: aiQuery.id,
        answer: 'TODO: AI response',
        score: 0.9,
      },
    });
  }

  // ---------- RELATION RESOLVERS ----------

  @ResolveField(() => User)
  async user(@Parent() aiQuery: AiQuery) {
    return this.prisma.aiQuery.findUnique({ where: { id: aiQuery.id } }).user();
  }

  @ResolveField(() => [AiQueryResult])
  async results(@Parent() aiQuery: AiQuery) {
    return this.prisma.aiQuery
      .findUnique({ where: { id: aiQuery.id } })
      .results({
        orderBy: { createdAt: 'desc' },
      });
  }
}

@Resolver(() => AiQueryResult)
export class AiQueryResultResolver {
  constructor(private readonly prisma: PrismaService) {}

  // ---------- BASE QUERIES ----------

  @Query(() => [AiQueryResult])
  async aiQueryResults() {
    return this.prisma.aiQueryResult.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  @Query(() => AiQueryResult, { nullable: true })
  async aiQueryResult(@Args('id') id: string) {
    return this.prisma.aiQueryResult.findUnique({
      where: { id },
    });
  }

  // ---------- RELATION RESOLVER ----------

  @ResolveField(() => AiQuery)
  async query(@Parent() result: AiQueryResult) {
    return this.prisma.aiQueryResult
      .findUnique({ where: { id: result.id } })
      .query();
  }
}
