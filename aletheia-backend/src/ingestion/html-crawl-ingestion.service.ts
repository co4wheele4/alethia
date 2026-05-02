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

  /** Source-of-truth for admin (GraphQL `req.user.role` can be missing on some requests). */
  async isAdminUser(userId: string): Promise<boolean> {
    const row = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    return row?.role === 'ADMIN';
  }

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

  async getRunForUser(id: string, userId: string, options?: { forAdmin?: boolean }) {
    const run = await this.prisma.htmlCrawlIngestionRun.findFirst({
      where: options?.forAdmin ? { id } : { id, createdByUserId: userId },
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
    });
    // List UI only needs run metadata; avoid joining every crawl evidence row (and HTML bytes) per run.
    return rows.map((r) => ({ ...r, fetchedEvidence: [] }));
  }

  /** Audit listing across users (ADMIN only at resolver). */
  async listAllRuns() {
    const rows = await this.prisma.htmlCrawlIngestionRun.findMany({
      orderBy: [{ startedAt: 'desc' }, { id: 'desc' }],
    });
    return rows.map((r) => ({ ...r, fetchedEvidence: [] }));
  }
}
