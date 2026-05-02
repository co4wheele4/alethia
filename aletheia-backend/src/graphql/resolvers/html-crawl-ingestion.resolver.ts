import { Args, Context, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Injectable, Scope, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { HtmlCrawlIngestionService } from '../../ingestion/html-crawl-ingestion.service';
import { HtmlCrawlIngestionRun } from '@models/html-crawl-ingestion.model';
import { CreateHtmlCrawlIngestionRunInput } from '@inputs/html-crawl-ingestion.input';
import { getGqlAuthUserId } from '../utils/gql-auth-user';
import { contractError, GQL_ERROR_CODES } from '../errors/graphql-error-codes';

type GqlContext = {
  req?: { user?: { sub?: string; id?: string; role?: string } };
};

function gqlRequestIsAdmin(ctx?: GqlContext): boolean {
  return ctx?.req?.user?.role === 'ADMIN';
}

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
    const forAdmin =
      gqlRequestIsAdmin(ctx) || (await this.svc.isAdminUser(userId));
    return this.svc.getRunForUser(id, userId, { forAdmin });
  }

  @Query(() => [HtmlCrawlIngestionRun])
  async htmlCrawlIngestionRuns(@Context() ctx?: GqlContext) {
    const userId = getGqlAuthUserId(ctx);
    if (!userId) throw contractError(GQL_ERROR_CODES.UNAUTHORIZED);
    const isAdmin =
      gqlRequestIsAdmin(ctx) || (await this.svc.isAdminUser(userId));
    if (isAdmin) {
      return this.svc.listAllRuns();
    }
    return this.svc.listRunsForUser(userId);
  }
}
