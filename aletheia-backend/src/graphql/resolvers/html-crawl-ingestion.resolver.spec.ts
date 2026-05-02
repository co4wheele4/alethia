import { HtmlCrawlIngestionResolver } from './html-crawl-ingestion.resolver';
import { HtmlCrawlIngestionService } from '../../ingestion/html-crawl-ingestion.service';
import { GQL_ERROR_CODES } from '../errors/graphql-error-codes';

describe('HtmlCrawlIngestionResolver', () => {
  const svc = {
    createRun: jest.fn(),
    getRunForUser: jest.fn(),
    listRunsForUser: jest.fn(),
    listAllRuns: jest.fn(),
    isAdminUser: jest.fn().mockResolvedValue(false),
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
    expect(svc.isAdminUser).toHaveBeenCalledWith('u1');
    expect(svc.getRunForUser).toHaveBeenCalledWith('id1', 'u1', {
      forAdmin: false,
    });
  });

  it('htmlCrawlIngestionRun uses forAdmin when DB says admin', async () => {
    svc.isAdminUser.mockResolvedValueOnce(true);
    svc.getRunForUser.mockResolvedValue({ id: 'r1' });
    await resolver.htmlCrawlIngestionRun('id1', {
      req: { user: { sub: 'u1' } },
    });
    expect(svc.getRunForUser).toHaveBeenCalledWith('id1', 'u1', {
      forAdmin: true,
    });
  });

  it('htmlCrawlIngestionRun passes forAdmin when user is ADMIN', async () => {
    svc.getRunForUser.mockResolvedValue({ id: 'r1' });
    await resolver.htmlCrawlIngestionRun('id1', {
      req: { user: { sub: 'u1', role: 'ADMIN' } },
    });
    expect(svc.getRunForUser).toHaveBeenCalledWith('id1', 'u1', {
      forAdmin: true,
    });
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
    expect(svc.isAdminUser).toHaveBeenCalledWith('u1');
    expect(svc.listRunsForUser).toHaveBeenCalledWith('u1');
    expect(svc.listAllRuns).not.toHaveBeenCalled();
  });

  it('htmlCrawlIngestionRuns uses listAllRuns for ADMIN', async () => {
    svc.listAllRuns.mockResolvedValue([{ id: 'a1' }]);
    const out = await resolver.htmlCrawlIngestionRuns({
      req: { user: { sub: 'u1', role: 'ADMIN' } },
    });
    expect(out).toEqual([{ id: 'a1' }]);
    expect(svc.listAllRuns).toHaveBeenCalled();
    expect(svc.listRunsForUser).not.toHaveBeenCalled();
  });

  it('htmlCrawlIngestionRuns uses listAllRuns when DB says admin', async () => {
    svc.isAdminUser.mockResolvedValueOnce(true);
    svc.listAllRuns.mockResolvedValue([{ id: 'a1' }]);
    const out = await resolver.htmlCrawlIngestionRuns({
      req: { user: { sub: 'u1' } },
    });
    expect(out).toEqual([{ id: 'a1' }]);
    expect(svc.listAllRuns).toHaveBeenCalled();
    expect(svc.listRunsForUser).not.toHaveBeenCalled();
  });
});
