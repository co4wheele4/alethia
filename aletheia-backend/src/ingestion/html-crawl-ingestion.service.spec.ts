import { HtmlCrawlFollowModeGql } from '@models/html-crawl-ingestion.model';
import { HtmlCrawlIngestionService } from './html-crawl-ingestion.service';
import { runHtmlCrawlIngestion } from './htmlCrawlRunner';

jest.mock('./htmlCrawlRunner', () => ({
  runHtmlCrawlIngestion: jest.fn(),
}));

describe('HtmlCrawlIngestionService', () => {
  let prisma: {
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

    prisma.htmlCrawlIngestionRun.findFirst.mockResolvedValueOnce(null);
    await expect(svc.getRunForUser('r1', 'u1')).resolves.toBeNull();
  });

  it('listRunsForUser maps rows', async () => {
    prisma.htmlCrawlIngestionRun.findMany.mockResolvedValueOnce([
      { id: 'a', evidenceRows: [] },
    ]);
    const rows = await svc.listRunsForUser('u1');
    expect(rows).toEqual([{ id: 'a', fetchedEvidence: [] }]);
  });
});
