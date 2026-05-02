import { HtmlCrawlFollowModeGql } from '@models/html-crawl-ingestion.model';
import { HtmlCrawlIngestionService } from './html-crawl-ingestion.service';
import { runHtmlCrawlIngestion } from './htmlCrawlRunner';

jest.mock('./htmlCrawlRunner', () => ({
  runHtmlCrawlIngestion: jest.fn(),
}));

describe('HtmlCrawlIngestionService', () => {
  let prisma: {
    user: { findUnique: jest.Mock };
    htmlCrawlIngestionRun: {
      findUniqueOrThrow: jest.Mock;
      findFirst: jest.Mock;
      findMany: jest.Mock;
    };
  };
  let svc: HtmlCrawlIngestionService;

  const baseInput = {
    seedUrl: 'https://a.com/',
    config: {
      crawlDepth: 1,
      maxPages: 2,
      allowedDomains: ['a.com'],
      includeQueryParams: false,
      followMode: HtmlCrawlFollowModeGql.STRICT_ONLY,
    },
  };

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({ role: 'USER' }),
      },
      htmlCrawlIngestionRun: {
        findUniqueOrThrow: jest.fn().mockResolvedValue({
          id: 'run-1',
          evidenceRows: [],
        }),
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
    };
    svc = new HtmlCrawlIngestionService(prisma as never);
    (runHtmlCrawlIngestion as jest.Mock).mockResolvedValue({ runId: 'run-1' });
  });

  it('createRun rejects unsupported follow mode', async () => {
    await expect(
      svc.createRun(
        {
          ...baseInput,
          config: {
            ...baseInput.config,
            followMode: 'OTHER' as unknown as HtmlCrawlFollowModeGql,
          },
        },
        'u1',
      ),
    ).rejects.toThrow(/REQUIRES_ADR/);
  });

  it('createRun maps evidenceRows to fetchedEvidence', async () => {
    const result = await svc.createRun(baseInput, 'u1');
    expect(result).toMatchObject({ id: 'run-1', fetchedEvidence: [] });
    expect(runHtmlCrawlIngestion).toHaveBeenCalled();
  });

  it('createRun forwards optional fetchImpl to the runner', async () => {
    const fetchImpl = jest.fn();
    await svc.createRun(baseInput, 'u1', { fetchImpl });
    expect(runHtmlCrawlIngestion).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ fetchImpl }),
    );
  });

  it('getRunForUser returns mapped run or null', async () => {
    prisma.htmlCrawlIngestionRun.findFirst.mockResolvedValueOnce({
      id: 'r1',
      evidenceRows: [],
    });
    await expect(svc.getRunForUser('r1', 'u1')).resolves.toMatchObject({
      id: 'r1',
      fetchedEvidence: [],
    });
    expect(prisma.htmlCrawlIngestionRun.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'r1', createdByUserId: 'u1' } }),
    );

    prisma.htmlCrawlIngestionRun.findFirst.mockResolvedValueOnce(null);
    await expect(svc.getRunForUser('r1', 'u1')).resolves.toBeNull();
  });

  it('getRunForUser forAdmin omits createdByUserId filter', async () => {
    prisma.htmlCrawlIngestionRun.findFirst.mockResolvedValueOnce({
      id: 'r1',
      evidenceRows: [],
    });
    await svc.getRunForUser('r1', 'u1', { forAdmin: true });
    expect(prisma.htmlCrawlIngestionRun.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'r1' } }),
    );
  });

  it('listAllRuns returns all runs without evidence join', async () => {
    prisma.htmlCrawlIngestionRun.findMany.mockResolvedValueOnce([
      { id: 'x' },
      { id: 'y' },
    ]);
    const rows = await svc.listAllRuns();
    expect(rows).toEqual([
      { id: 'x', fetchedEvidence: [] },
      { id: 'y', fetchedEvidence: [] },
    ]);
    expect(prisma.htmlCrawlIngestionRun.findMany.mock.calls[0][0]).toEqual({
      orderBy: [{ startedAt: 'desc' }, { id: 'desc' }],
    });
  });

  it('listRunsForUser maps rows without evidence joins', async () => {
    prisma.htmlCrawlIngestionRun.findMany.mockResolvedValueOnce([{ id: 'a' }]);
    const rows = await svc.listRunsForUser('u1');
    expect(rows).toEqual([{ id: 'a', fetchedEvidence: [] }]);
    expect(prisma.htmlCrawlIngestionRun.findMany.mock.calls[0][0]).toEqual({
      where: { createdByUserId: 'u1' },
      orderBy: [{ startedAt: 'desc' }, { id: 'desc' }],
    });
  });

  it('isAdminUser reads role from database', async () => {
    prisma.user.findUnique.mockResolvedValueOnce({ role: 'ADMIN' });
    await expect(svc.isAdminUser('u1')).resolves.toBe(true);
    prisma.user.findUnique.mockResolvedValueOnce({ role: 'USER' });
    await expect(svc.isAdminUser('u1')).resolves.toBe(false);
    prisma.user.findUnique.mockResolvedValueOnce(null);
    await expect(svc.isAdminUser('u1')).resolves.toBe(false);
  });
});
