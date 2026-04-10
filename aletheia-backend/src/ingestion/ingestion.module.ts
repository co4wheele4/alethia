import { Module } from '@nestjs/common';
import { IngestionService } from './ingestion.service';
import { ExtractionService } from './extraction.service';
import { IngestionResolver } from './ingestion.resolver';
import { PrismaService } from '@prisma/prisma.service';
import { HtmlCrawlIngestionService } from './html-crawl-ingestion.service';
import { HtmlCrawlIngestionResolver } from '../graphql/resolvers/html-crawl-ingestion.resolver';

@Module({
  providers: [
    IngestionService,
    ExtractionService,
    IngestionResolver,
    HtmlCrawlIngestionService,
    HtmlCrawlIngestionResolver,
    PrismaService,
  ],
  exports: [IngestionService, ExtractionService, HtmlCrawlIngestionService],
})
export class IngestionModule {}
