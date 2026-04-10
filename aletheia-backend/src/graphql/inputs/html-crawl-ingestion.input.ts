import { Field, InputType, Int } from '@nestjs/graphql';
import { HtmlCrawlFollowModeGql } from '@models/html-crawl-ingestion.model';

@InputType()
export class HtmlCrawlConfigInput {
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
}

@InputType()
export class CreateHtmlCrawlIngestionRunInput {
  @Field()
  seedUrl!: string;

  @Field(() => HtmlCrawlConfigInput)
  config!: HtmlCrawlConfigInput;
}
