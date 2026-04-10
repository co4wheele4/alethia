import { Args, Context, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Injectable, Scope, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { HtmlCrawlIngestionService } from '../../ingestion/html-crawl-ingestion.service';
import { HtmlCrawlIngestionRun } from '@models/html-crawl-ingestion.model';
import { CreateHtmlCrawlIngestionRunInput } from '@inputs/html-crawl-ingestion.input';
import { getGqlAuthUserId } from '../utils/gql-auth-user';
import { contractError, GQL_ERROR_CODES } from '../errors/graphql-error-codes';

type GqlContext = {
  req?: { user?: { sub?: string; id?: string } };
};

const runType = () => HtmlCrawlIngestionRun;
void runType();

@Injectable({ scope: Scope.REQUEST })
@Resolver()
@UseGuards(JwtAuthGuard)
export class HtmlCrawlIngestionResolver {
  constructor(private readonly svc: HtmlCrawlIngestionService) {}

  @Mutation(() => HtmlCrawlIngestionRun)
  async createHtmlCrawlIngestionRun(
    @Args('input') input: CreateHtmlCrawlIngestionRunInput,
    @Context() ctx?: GqlContext,
  ) {
    const userId = getGqlAuthUserId(ctx);
    if (!userId) throw contractError(GQL_ERROR_CODES.UNAUTHORIZED);
    return this.svc.createRun(input, userId);
  }

  @Query(() => HtmlCrawlIngestionRun, { nullable: true })
  async htmlCrawlIngestionRun(
    @Args('id', { type: () => ID }) id: string,
    @Context() ctx?: GqlContext,
  ) {
    const userId = getGqlAuthUserId(ctx);
    if (!userId) throw contractError(GQL_ERROR_CODES.UNAUTHORIZED);
    return this.svc.getRunForUser(id, userId);
  }

  @Query(() => [HtmlCrawlIngestionRun])
  async htmlCrawlIngestionRuns(@Context() ctx?: GqlContext) {
    const userId = getGqlAuthUserId(ctx);
    if (!userId) throw contractError(GQL_ERROR_CODES.UNAUTHORIZED);
    return this.svc.listRunsForUser(userId);
  }
}
