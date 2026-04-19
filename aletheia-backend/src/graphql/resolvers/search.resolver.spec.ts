import { ClaimStatus } from '@models/claim.model';
import { EvidenceSourceKind } from '@models/evidence.model';
import { SearchResolver } from './search.resolver';
import { PrismaService } from '@prisma/prisma.service';
import { TextMatchMode } from '../enums/search-text-match.enum';
import { DeterministicOrderBy } from '../enums/search-text-match.enum';
import { GQL_ERROR_CODES } from '../errors/graphql-error-codes';

describe('SearchResolver', () => {
  const findManyClaims = jest.fn();
  const findManyEvidence = jest.fn();
  const prisma = {
    claim: { findMany: findManyClaims },
    evidence: { findMany: findManyEvidence },
  } as unknown as PrismaService;

  const resolver = new SearchResolver(prisma);

  const ctx = {
    req: { user: { id: 'user-1' } },
  };

  const emptyCtx = { req: {} };

  beforeEach(() => {
    findManyClaims.mockReset();
    findManyEvidence.mockReset();
    findManyClaims.mockResolvedValue([]);
    findManyEvidence.mockResolvedValue([]);
  });

  it('searchClaims applies deterministic order (createdAt asc tie-break id)', async () => {
    await resolver.searchClaims(
      {
        queryText: 'hello',
        matchMode: TextMatchMode.SUBSTRING,
        caseSensitive: false,
        orderBy: DeterministicOrderBy.CREATED_AT_ASC,
        limit: 10,
        offset: 0,
      },
      ctx,
    );
    expect(findManyClaims).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        take: 10,
        skip: 0,
      }),
    );
  });

  it('searchEvidence applies id desc when requested', async () => {
    await resolver.searchEvidence(
      {
        queryText: '',
        matchMode: TextMatchMode.EXACT,
        caseSensitive: true,
        orderBy: DeterministicOrderBy.ID_DESC,
        limit: 5,
        offset: 2,
      },
      ctx,
    );
    expect(findManyEvidence).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ id: 'desc' }],
        take: 5,
        skip: 2,
      }),
    );
  });

  it('returns empty lists when user is not authenticated', async () => {
    await expect(
      resolver.searchClaims(
        {
          queryText: '',
          matchMode: TextMatchMode.EXACT,
          caseSensitive: true,
          orderBy: DeterministicOrderBy.ID_ASC,
          limit: 10,
          offset: 0,
        },
        emptyCtx,
      ),
    ).resolves.toEqual([]);
    expect(findManyClaims).not.toHaveBeenCalled();

    await expect(
      resolver.searchEvidence(
        {
          queryText: '',
          matchMode: TextMatchMode.EXACT,
          caseSensitive: true,
          orderBy: DeterministicOrderBy.ID_ASC,
          limit: 10,
          offset: 0,
        },
        emptyCtx,
      ),
    ).resolves.toEqual([]);
    expect(findManyEvidence).not.toHaveBeenCalled();
  });

  it('rejects non-finite or out-of-range pagination', async () => {
    await expect(
      resolver.searchClaims(
        {
          queryText: '',
          matchMode: TextMatchMode.EXACT,
          caseSensitive: true,
          orderBy: DeterministicOrderBy.ID_ASC,
          limit: Number.NaN,
          offset: 0,
        },
        ctx,
      ),
    ).rejects.toMatchObject({
      message: GQL_ERROR_CODES.INVALID_SEARCH_PAGINATION,
    });

    await expect(
      resolver.searchClaims(
        {
          queryText: '',
          matchMode: TextMatchMode.EXACT,
          caseSensitive: true,
          orderBy: DeterministicOrderBy.ID_ASC,
          limit: 10,
          offset: -1,
        },
        ctx,
      ),
    ).rejects.toMatchObject({
      message: GQL_ERROR_CODES.INVALID_SEARCH_PAGINATION,
    });

    await expect(
      resolver.searchClaims(
        {
          queryText: '',
          matchMode: TextMatchMode.EXACT,
          caseSensitive: true,
          orderBy: DeterministicOrderBy.ID_ASC,
          limit: 0,
          offset: 0,
        },
        ctx,
      ),
    ).rejects.toMatchObject({
      message: GQL_ERROR_CODES.INVALID_SEARCH_PAGINATION,
    });
  });

  it('searchClaims requires workspace isolation (evidence → document ownership) in where clause', async () => {
    await resolver.searchClaims(
      {
        queryText: '',
        matchMode: TextMatchMode.EXACT,
        caseSensitive: true,
        orderBy: DeterministicOrderBy.ID_ASC,
        limit: 10,
        offset: 0,
      },
      ctx,
    );
    const where = findManyClaims.mock.calls[0][0].where as {
      AND: unknown[];
    };
    expect(where.AND[0]).toEqual({
      OR: [
        { createdByUserId: 'user-1' },
        {
          evidenceLinks: {
            some: {
              evidence: {
                sourceDocument: { userId: 'user-1' },
              },
            },
          },
        },
        {
          evidence: {
            some: {
              document: { userId: 'user-1' },
            },
          },
        },
      ],
    });
  });

  it('searchClaims applies optional filters (lifecycle, dates, evidence source)', async () => {
    const createdAtAfter = new Date('2024-01-01T00:00:00.000Z');
    const createdAtBefore = new Date('2024-12-31T23:59:59.000Z');
    await resolver.searchClaims(
      {
        queryText: 'needle',
        matchMode: TextMatchMode.SUBSTRING,
        caseSensitive: false,
        orderBy: DeterministicOrderBy.ID_ASC,
        limit: 10,
        offset: 0,
        filters: {
          lifecycle: ClaimStatus.REVIEWED,
          evidenceSourceType: EvidenceSourceKind.URL,
          createdAtAfter,
          createdAtBefore,
        },
      },
      ctx,
    );
    const where = findManyClaims.mock.calls[0][0].where as {
      AND: unknown[];
    };
    expect(where.AND).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ status: ClaimStatus.REVIEWED }),
        expect.objectContaining({
          createdAt: { gte: createdAtAfter, lte: createdAtBefore },
        }),
        expect.objectContaining({
          evidenceLinks: {
            some: {
              evidence: { sourceType: EvidenceSourceKind.URL },
            },
          },
        }),
      ]),
    );
  });

  it('searchClaims uses partial createdAt range when only one bound is set', async () => {
    const createdAtAfter = new Date('2024-03-01T00:00:00.000Z');
    await resolver.searchClaims(
      {
        queryText: '',
        matchMode: TextMatchMode.EXACT,
        caseSensitive: true,
        orderBy: DeterministicOrderBy.ID_ASC,
        limit: 5,
        offset: 0,
        filters: { createdAtAfter },
      },
      ctx,
    );
    const whereAfter = findManyClaims.mock.calls[0][0].where as {
      AND: unknown[];
    };
    expect(whereAfter.AND).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          createdAt: { gte: createdAtAfter },
        }),
      ]),
    );

    const createdAtBefore = new Date('2024-06-01T00:00:00.000Z');
    await resolver.searchClaims(
      {
        queryText: '',
        matchMode: TextMatchMode.EXACT,
        caseSensitive: true,
        orderBy: DeterministicOrderBy.ID_ASC,
        limit: 5,
        offset: 0,
        filters: { createdAtBefore },
      },
      ctx,
    );
    const whereBefore = findManyClaims.mock.calls[1][0].where as {
      AND: unknown[];
    };
    expect(whereBefore.AND).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          createdAt: { lte: createdAtBefore },
        }),
      ]),
    );
  });

  it('searchEvidence applies optional filters and text OR on snippet/sourceUrl', async () => {
    const createdAtAfter = new Date('2025-06-01T00:00:00.000Z');
    await resolver.searchEvidence(
      {
        queryText: 'foo',
        matchMode: TextMatchMode.SUBSTRING,
        caseSensitive: true,
        orderBy: DeterministicOrderBy.CREATED_AT_ASC,
        limit: 20,
        offset: 1,
        filters: {
          sourceType: EvidenceSourceKind.DOCUMENT,
          createdAtAfter,
        },
      },
      ctx,
    );
    const where = findManyEvidence.mock.calls[0][0].where as {
      AND: unknown[];
    };
    expect(where.AND).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourceType: EvidenceSourceKind.DOCUMENT,
        }),
        expect.objectContaining({
          createdAt: { gte: createdAtAfter },
        }),
        expect.objectContaining({
          OR: [
            { snippet: expect.anything() },
            { sourceUrl: expect.anything() },
          ],
        }),
      ]),
    );
  });

  it('searchEvidence omits text predicate when queryText is empty', async () => {
    const createdAtBefore = new Date('2025-12-31T23:59:59.000Z');
    await resolver.searchEvidence(
      {
        queryText: '',
        matchMode: TextMatchMode.SUBSTRING,
        caseSensitive: false,
        orderBy: DeterministicOrderBy.ID_ASC,
        limit: 3,
        offset: 0,
        filters: { createdAtBefore },
      },
      ctx,
    );
    const where = findManyEvidence.mock.calls[0][0].where as {
      AND: unknown[];
    };
    expect(where.AND).toHaveLength(2);
    expect(where.AND).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          createdAt: { lte: createdAtBefore },
        }),
      ]),
    );
  });

  it('rejects limit above ADR-033 cap', async () => {
    await expect(
      resolver.searchClaims(
        {
          queryText: '',
          matchMode: TextMatchMode.EXACT,
          caseSensitive: true,
          orderBy: DeterministicOrderBy.ID_ASC,
          limit: 9999,
          offset: 0,
        },
        ctx,
      ),
    ).rejects.toMatchObject({
      message: GQL_ERROR_CODES.INVALID_SEARCH_PAGINATION,
    });
  });
});
