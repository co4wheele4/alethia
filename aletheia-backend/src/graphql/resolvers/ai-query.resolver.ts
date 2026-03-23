import {
  Args,
  Mutation,
  Parent,
  Query,
  Resolver,
  ResolveField,
  Int,
} from '@nestjs/graphql';
import { UseGuards, Scope, Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { AiQuery, AiQueryResult } from '@models/ai-query.model';
import { User } from '@models/user.model';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { DataLoaderService } from '@common/dataloaders/dataloader.service';

@Injectable({ scope: Scope.REQUEST })
@Resolver(() => AiQuery)
@UseGuards(JwtAuthGuard)
export class AiQueryResolver {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dataLoaders: DataLoaderService,
  ) {}

  // ---------- BASE QUERIES ----------

  @Query(() => [AiQuery])
  async aiQueries() {
    return await this.prisma.aiQuery.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  @Query(() => AiQuery, { nullable: true })
  async aiQuery(@Args('id') id: string) {
    return await this.prisma.aiQuery.findUnique({
      where: { id },
    });
  }

  @Query(() => [AiQuery])
  async aiQueriesByUser(@Args('userId') userId: string) {
    return await this.prisma.aiQuery.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Query(() => [AiQuery])
  async aiQueriesPaged(
    @Args('skip', { type: () => Int, nullable: true }) skip = 0,
    @Args('take', { type: () => Int, nullable: true }) take = 20,
  ) {
    const validatedSkip = skip != null && skip >= 0 ? skip : 0;
    const validatedTake = take != null && take >= 0 ? take : 20;

    return await this.prisma.aiQuery.findMany({
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

    // placeholder – OpenAI integration later (score omitted; ADR-022)
    return await this.prisma.aiQueryResult.create({
      data: {
        queryId: aiQuery.id,
        answer: 'TODO: AI response',
      },
    });
  }

  // ---------- RELATION RESOLVERS ----------

  @ResolveField(() => User)
  async user(@Parent() aiQuery: AiQuery) {
    const aiQueryWithUserId = aiQuery as unknown as { userId: string };
    return this.dataLoaders.getUserLoader().load(aiQueryWithUserId.userId);
  }

  @ResolveField(() => [AiQueryResult])
  async results(@Parent() aiQuery: AiQuery) {
    return this.dataLoaders.getResultsByQueryLoader().load(aiQuery.id);
  }
}

@Injectable({ scope: Scope.REQUEST })
@Resolver(() => AiQueryResult)
@UseGuards(JwtAuthGuard)
export class AiQueryResultResolver {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dataLoaders: DataLoaderService,
  ) {}

  // ---------- BASE QUERIES ----------

  @Query(() => [AiQueryResult])
  async aiQueryResults() {
    return await this.prisma.aiQueryResult.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  @Query(() => AiQueryResult, { nullable: true })
  async aiQueryResult(@Args('id') id: string) {
    return await this.prisma.aiQueryResult.findUnique({
      where: { id },
    });
  }

  // ---------- RELATION RESOLVER ----------

  @ResolveField(() => AiQuery)
  async query(@Parent() result: AiQueryResult) {
    const resultWithQueryId = result as unknown as { queryId: string };
    return this.dataLoaders.getAiQueryLoader().load(resultWithQueryId.queryId);
  }
}
