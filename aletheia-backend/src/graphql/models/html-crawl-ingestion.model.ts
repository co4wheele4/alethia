import { Field, ID, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Evidence } from './evidence.model';

export enum HtmlCrawlFollowModeGql {
  STRICT_ONLY = 'STRICT_ONLY',
}

export enum HtmlCrawlRunStatusGql {
  SUCCESS = 'SUCCESS',
  PARTIAL = 'PARTIAL',
  FAILED = 'FAILED',
}

export enum HtmlCrawlFetchStatusGql {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

registerEnumType(HtmlCrawlFollowModeGql, { name: 'HtmlCrawlFollowMode' });
registerEnumType(HtmlCrawlRunStatusGql, { name: 'HtmlCrawlRunStatus' });
registerEnumType(HtmlCrawlFetchStatusGql, { name: 'HtmlCrawlFetchStatus' });

@ObjectType()
export class HtmlCrawlIngestionRunEvidence {
  @Field(() => ID, { nullable: true })
  evidenceId?: string | null;

  @Field()
  url!: string;

  @Field(() => Int)
  depth!: number;

  @Field(() => HtmlCrawlFetchStatusGql)
  fetchStatus!: HtmlCrawlFetchStatusGql;

  @Field(() => String, { nullable: true })
  errorMessage?: string | null;

  @Field(() => Evidence, { nullable: true })
  evidence?: Evidence | null;
}

@ObjectType()
export class HtmlCrawlIngestionRun {
  @Field(() => ID)
  id!: string;

  @Field()
  seedUrl!: string;

  @Field(() => Int)
  crawlDepth!: number;

  @Field(() => Int)
  maxPages!: number;

  @Field(() => [String])
  allowedDomains!: string[];

  @Field()
  includeQueryParams!: boolean;

  @Field(() => HtmlCrawlFollowModeGql)
  followMode!: HtmlCrawlFollowModeGql;

  @Field()
  startedAt!: Date;

  @Field(() => Date, { nullable: true })
  finishedAt?: Date | null;

  @Field(() => HtmlCrawlRunStatusGql)
  status!: HtmlCrawlRunStatusGql;

  @Field(() => String, { nullable: true })
  errorLog?: string | null;

  @Field(() => [HtmlCrawlIngestionRunEvidence])
  fetchedEvidence!: HtmlCrawlIngestionRunEvidence[];
}
