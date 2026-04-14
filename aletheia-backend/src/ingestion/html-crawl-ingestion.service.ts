import { Injectable } from '@nestjs/common';
import { HtmlCrawlFollowMode } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';
import { CreateHtmlCrawlIngestionRunInput } from '@inputs/html-crawl-ingestion.input';
import { runHtmlCrawlIngestion } from './htmlCrawlRunner';

function mapRunWithFetchedEvidence<T extends { evidenceRows: unknown[] }>(
  r: T,
) {
  const { evidenceRows, ...rest } = r;
  return { ...rest, fetchedEvidence: evidenceRows };
}

@Injectable()
export class HtmlCrawlIngestionService {
  constructor(private readonly prisma: PrismaService) {}

  async createRun(
    input: CreateHtmlCrawlIngestionRunInput,
    createdByUserId: string,
    options?: { fetchImpl?: typeof fetch },
  ) {
    if (input.config.followMode !== 'STRICT_ONLY') {
      throw new Error('REQUIRES_ADR: unsupported HtmlCrawlFollowMode');
    }

    const { runId } = await runHtmlCrawlIngestion(this.prisma, {
      seedUrl: input.seedUrl,
      createdByUserId,
      fetchImpl: options?.fetchImpl,
      config: {
        crawlDepth: input.config.crawlDepth,
        maxPages: input.config.maxPages,
        allowedDomains: input.config.allowedDomains,
        includeQueryParams: input.config.includeQueryParams,
        followMode: HtmlCrawlFollowMode.STRICT_ONLY,
      },
    });

    const row = await this.prisma.htmlCrawlIngestionRun.findUniqueOrThrow({
      where: { id: runId },
      include: {
        evidenceRows: {
          orderBy: [{ depth: 'asc' }, { url: 'asc' }, { id: 'asc' }],
          include: { evidence: true },
        },
      },
    });
    return mapRunWithFetchedEvidence(row);
  }

  async getRunForUser(id: string, userId: string) {
    const run = await this.prisma.htmlCrawlIngestionRun.findFirst({
      where: { id, createdByUserId: userId },
      include: {
        evidenceRows: {
          orderBy: [{ depth: 'asc' }, { url: 'asc' }, { id: 'asc' }],
          include: { evidence: true },
        },
      },
    });
    return run ? mapRunWithFetchedEvidence(run) : null;
  }

  async listRunsForUser(userId: string) {
    const rows = await this.prisma.htmlCrawlIngestionRun.findMany({
      where: { createdByUserId: userId },
      orderBy: [{ startedAt: 'desc' }, { id: 'desc' }],
      include: {
        evidenceRows: {
          orderBy: [{ depth: 'asc' }, { url: 'asc' }, { id: 'asc' }],
          include: { evidence: true },
        },
      },
    });
    return rows.map(mapRunWithFetchedEvidence);
  }
}
