import { HtmlCrawlIngestionResolver } from './html-crawl-ingestion.resolver';
import { HtmlCrawlIngestionService } from '../../ingestion/html-crawl-ingestion.service';
import { GQL_ERROR_CODES } from '../errors/graphql-error-codes';

describe('HtmlCrawlIngestionResolver', () => {
  const svc = {
    createRun: jest.fn(),
    getRunForUser: jest.fn(),
    listRunsForUser: jest.fn(),
  };
  let resolver: HtmlCrawlIngestionResolver;

  beforeEach(() => {
    jest.clearAllMocks();
    resolver = new HtmlCrawlIngestionResolver(
      svc as unknown as HtmlCrawlIngestionService,
    );
  });

  it('createHtmlCrawlIngestionRun rejects when unauthenticated', async () => {
    await expect(
      resolver.createHtmlCrawlIngestionRun(
        { seedUrl: 'x', config: {} } as never,
        {},
      ),
    ).rejects.toMatchObject({
      extensions: { code: GQL_ERROR_CODES.UNAUTHORIZED },
    });
  });

  it('createHtmlCrawlIngestionRun delegates to service', async () => {
    svc.createRun.mockResolvedValue({ id: 'r1' });
    const input = { seedUrl: 'https://x', config: {} } as never;
    const out = await resolver.createHtmlCrawlIngestionRun(input, {
      req: { user: { sub: 'u1' } },
    });
    expect(out).toEqual({ id: 'r1' });
    expect(svc.createRun).toHaveBeenCalledWith(input, 'u1');
  });

  it('htmlCrawlIngestionRun rejects when unauthenticated', async () => {
    await expect(
      resolver.htmlCrawlIngestionRun('id1', {}),
    ).rejects.toMatchObject({
      extensions: { code: GQL_ERROR_CODES.UNAUTHORIZED },
    });
  });

  it('htmlCrawlIngestionRun delegates to service', async () => {
    svc.getRunForUser.mockResolvedValue({ id: 'r1' });
    const out = await resolver.htmlCrawlIngestionRun('id1', {
      req: { user: { sub: 'u1' } },
    });
    expect(out).toEqual({ id: 'r1' });
    expect(svc.getRunForUser).toHaveBeenCalledWith('id1', 'u1');
  });

  it('htmlCrawlIngestionRuns rejects when unauthenticated', async () => {
    await expect(resolver.htmlCrawlIngestionRuns({})).rejects.toMatchObject({
      extensions: { code: GQL_ERROR_CODES.UNAUTHORIZED },
    });
  });

  it('htmlCrawlIngestionRuns delegates to service', async () => {
    svc.listRunsForUser.mockResolvedValue([{ id: 'r1' }]);
    const out = await resolver.htmlCrawlIngestionRuns({
      req: { user: { sub: 'u1' } },
    });
    expect(out).toEqual([{ id: 'r1' }]);
    expect(svc.listRunsForUser).toHaveBeenCalledWith('u1');
  });
});
