import {
  setupTestApp,
  teardownTestApp,
  TestContext,
} from '../../helpers/test-setup';
import { graphqlRequest } from '../../helpers/graphql-request';

describe('HtmlCrawlIngestionResolver (e2e)', () => {
  let context: TestContext;
  let fetchSpy: jest.SpiedFunction<typeof fetch>;

  beforeAll(async () => {
    context = await setupTestApp();
  });

  afterAll(async () => {
    await teardownTestApp(context);
  });

  beforeEach(() => {
    fetchSpy = jest.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      return new Response(
        '<html><body><a href="https://example.com/b">x</a></body></html>',
        {
          status: 200,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        },
      );
    });
  });

  afterEach(() => {
    // If beforeEach failed before assigning fetchSpy, restore is a no-op (Jest still runs afterEach).
    fetchSpy?.mockRestore();
  });

  it('createHtmlCrawlIngestionRun persists run, join rows, and immutable evidence bytes', async () => {
    const mutation = `
      mutation CreateHtmlCrawlIngestionRun($input: CreateHtmlCrawlIngestionRunInput!) {
        createHtmlCrawlIngestionRun(input: $input) {
          id
          status
          seedUrl
          crawlDepth
          maxPages
          fetchedEvidence {
            url
            depth
            fetchStatus
            evidenceId
            evidence {
              id
              sourceType
              contentSha256
            }
          }
        }
      }
    `;

    const variables = {
      input: {
        seedUrl: 'https://example.com/root',
        config: {
          crawlDepth: 0,
          maxPages: 3,
          allowedDomains: ['example.com'],
          includeQueryParams: false,
          followMode: 'STRICT_ONLY',
        },
      },
    };

    const res = await graphqlRequest<{
      createHtmlCrawlIngestionRun: {
        id: string;
        status: string;
        fetchedEvidence: Array<{
          evidenceId: string | null;
          evidence: {
            id: string;
            contentSha256: string;
            sourceType: string;
          } | null;
        }>;
      };
    }>(context.app, mutation, variables, { authToken: context.auth.userToken });

    expect(res.status).toBe(200);
    expect(res.body?.errors).toBeUndefined();

    const run = res.body?.data?.createHtmlCrawlIngestionRun;
    expect(run?.id).toBeDefined();
    expect(run?.fetchedEvidence?.length).toBe(1);
    const evId = run?.fetchedEvidence?.[0]?.evidenceId;
    expect(evId).toBeDefined();

    const evRow = await context.prisma.evidence.findUniqueOrThrow({
      where: { id: evId! },
    });
    expect(evRow.sourceType).toBe('HTML_PAGE');
    expect(evRow.rawBody).toBeTruthy();
    expect(fetchSpy).toHaveBeenCalled();
  });
});
