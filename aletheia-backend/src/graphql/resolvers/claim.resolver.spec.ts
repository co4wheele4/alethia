import { ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { DataLoaderService } from '@common/dataloaders/dataloader.service';
import { ClaimStatus as PrismaClaimStatus } from '@prisma/client';
import { GQL_ERROR_CODES } from '../errors/graphql-error-codes';
import { ClaimResolver } from './claim.resolver';

describe('ClaimResolver', () => {
  let resolver: ClaimResolver;
  let prisma: PrismaService;
  let dataLoaders: jest.Mocked<DataLoaderService>;
  let claimFindMany: jest.Mock;
  let claimCreate: jest.Mock;
  let claimEvidenceFindMany: jest.Mock;
  let claimEvidenceLinkFindMany: jest.Mock;
  let documentFindUnique: jest.Mock;

  beforeEach(() => {
    claimFindMany = jest.fn();
    claimCreate = jest.fn();
    claimEvidenceFindMany = jest.fn();
    claimEvidenceLinkFindMany = jest.fn();
    documentFindUnique = jest.fn();

    prisma = {
      claim: { findMany: claimFindMany, create: claimCreate },
      claimEvidence: { findMany: claimEvidenceFindMany },
      claimEvidenceLink: { findMany: claimEvidenceLinkFindMany },
      document: { findUnique: documentFindUnique },
    } as unknown as PrismaService;

    dataLoaders = {
      getDocumentLoader: jest.fn(),
    } as unknown as jest.Mocked<DataLoaderService>;

    resolver = new ClaimResolver(prisma, dataLoaders);
  });

  it('claims returns empty list when unauthenticated', async () => {
    const result = await resolver.claims(undefined, 100, 0, {
      req: { user: {} },
    });
    expect(result).toEqual([]);
    expect(claimFindMany).not.toHaveBeenCalled();
  });

  it('claims applies lifecycle filter when provided', async () => {
    claimFindMany.mockResolvedValue([] as any);
    await resolver.claims({ lifecycle: 'ACCEPTED' as any }, 100, 0, {
      req: { user: { sub: 'u1' } },
    });
    expect(claimFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            expect.objectContaining({ status: 'ACCEPTED' }),
          ]),
        }),
        take: 100,
        skip: 0,
      }),
    );
  });

  it('claims applies hasEvidence:true filter when provided', async () => {
    claimFindMany.mockResolvedValue([] as any);
    await resolver.claims({ hasEvidence: true }, 100, 0, {
      req: { user: { sub: 'u1' } },
    });
    expect(claimFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            {
              OR: [{ evidence: { some: {} } }, { evidenceLinks: { some: {} } }],
            },
          ]),
        }),
        take: 100,
        skip: 0,
      }),
    );
  });

  it('claims applies hasEvidence:false filter when provided', async () => {
    claimFindMany.mockResolvedValue([] as any);
    await resolver.claims({ hasEvidence: false }, 100, 0, {
      req: { user: { sub: 'u1' } },
    });
    expect(claimFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            {
              AND: [
                { evidence: { none: {} } },
                { evidenceLinks: { none: {} } },
              ],
            },
          ]),
        }),
        take: 100,
        skip: 0,
      }),
    );
  });

  it('claims queries by evidence->document.userId when authenticated', async () => {
    claimFindMany.mockResolvedValue([{ id: 'c1' }] as any);
    const result = await resolver.claims(undefined, 100, 0, {
      req: { user: { sub: 'u1' } },
    });
    expect(result).toEqual([{ id: 'c1' }]);
    expect(claimFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          AND: [
            {
              OR: [
                { createdByUserId: 'u1' },
                {
                  evidenceLinks: {
                    some: {
                      evidence: {
                        sourceDocument: { userId: 'u1' },
                      },
                    },
                  },
                },
                {
                  evidence: {
                    some: { document: { userId: 'u1' } },
                  },
                },
              ],
            },
          ],
        },
        take: 100,
        skip: 0,
      }),
    );
  });

  it('createClaim persists DRAFT with createdByUserId', async () => {
    claimCreate.mockResolvedValue({
      id: 'new',
      text: 'Hello',
      status: 'DRAFT',
    } as any);
    const result = await resolver.createClaim('  Hello  ', {
      req: { user: { sub: 'u1' } },
    });
    expect(result.id).toBe('new');
    expect(claimCreate).toHaveBeenCalledWith({
      data: {
        text: 'Hello',
        status: PrismaClaimStatus.DRAFT,
        createdByUserId: 'u1',
      },
    });
  });

  it('createClaim rejects empty text', async () => {
    await expect(
      resolver.createClaim('   ', { req: { user: { sub: 'u1' } } } as any),
    ).rejects.toMatchObject({
      message: 'CLAIM_TEXT_REQUIRED',
      extensions: { code: 'CLAIM_TEXT_REQUIRED' },
    });
  });

  it('createClaim rejects UNAUTHORIZED when unauthenticated', async () => {
    await expect(
      resolver.createClaim('hello', { req: { user: {} } } as any),
    ).rejects.toMatchObject({
      extensions: { code: GQL_ERROR_CODES.UNAUTHORIZED },
    });
    expect(claimCreate).not.toHaveBeenCalled();
  });

  it('createClaim treats non-string text as empty (CLAIM_TEXT_REQUIRED)', async () => {
    await expect(
      resolver.createClaim(
        null as any,
        { req: { user: { sub: 'u1' } } } as any,
      ),
    ).rejects.toMatchObject({
      extensions: { code: GQL_ERROR_CODES.CLAIM_TEXT_REQUIRED },
    });
    expect(claimCreate).not.toHaveBeenCalled();
  });

  it('claimsByDocument returns empty list when unauthenticated', async () => {
    const result = await resolver.claimsByDocument('doc_1', 100, 0, {
      req: { user: {} },
    });
    expect(result).toEqual([]);
    expect(documentFindUnique).not.toHaveBeenCalled();
  });

  it('claimsByDocument returns empty list when document does not exist', async () => {
    documentFindUnique.mockResolvedValue(null as any);
    const result = await resolver.claimsByDocument('doc_1', 100, 0, {
      req: { user: { sub: 'u1' } },
    });
    expect(result).toEqual([]);
  });

  it('claimsByDocument forbids access when document belongs to another user', async () => {
    documentFindUnique.mockResolvedValue({
      id: 'doc_1',
      userId: 'other',
    } as any);
    await expect(
      resolver.claimsByDocument('doc_1', 100, 0, {
        req: { user: { sub: 'u1' } },
      } as any),
    ).rejects.toThrow(ForbiddenException);
  });

  it('claimsByDocument queries claims when authorized', async () => {
    documentFindUnique.mockResolvedValue({
      id: 'doc_1',
      userId: 'u1',
    } as any);
    claimFindMany.mockResolvedValue([{ id: 'c1' }] as any);
    const result = await resolver.claimsByDocument('doc_1', 100, 0, {
      req: { user: { sub: 'u1' } },
    });
    expect(result).toEqual([{ id: 'c1' }]);
    expect(claimFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            {
              evidenceLinks: {
                some: {
                  evidence: { sourceDocumentId: 'doc_1' },
                },
              },
            },
            { evidence: { some: { documentId: 'doc_1' } } },
          ],
        },
        take: 100,
        skip: 0,
      }),
    );
  });

  it('evidence resolveField returns empty list when claim has no evidence (ADR-018)', async () => {
    claimEvidenceLinkFindMany.mockResolvedValue([] as any);
    claimEvidenceFindMany.mockResolvedValue([] as any);
    await expect(resolver.evidence({ id: 'c1' } as any)).resolves.toEqual([]);
  });

  it('evidence resolveField returns evidence anchors when present (from links)', async () => {
    claimEvidenceLinkFindMany.mockResolvedValue([
      { evidence: { id: 'ev1' } },
    ] as any);
    const result = await resolver.evidence({ id: 'c1' } as any);
    expect(result).toEqual([{ id: 'ev1' }]);
  });

  it('evidence resolveField returns legacy evidence when no links', async () => {
    claimEvidenceLinkFindMany.mockResolvedValue([] as any);
    claimEvidenceFindMany.mockResolvedValue([
      {
        id: 'ce1',
        documentId: 'doc_1',
        createdAt: new Date(),
        document: { userId: 'u1' },
      },
    ] as any);
    const result = await resolver.evidence({ id: 'c1' } as any);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'ce1',
      sourceDocumentId: 'doc_1',
      sourceType: 'DOCUMENT',
    });
  });

  it('documents resolveField returns empty list when no evidence anchors (ADR-018)', async () => {
    claimEvidenceLinkFindMany.mockResolvedValue([] as any);
    claimEvidenceFindMany.mockResolvedValue([] as any);
    await expect(resolver.documents({ id: 'c1' } as any)).resolves.toEqual([]);
  });

  it('documents resolveField fails when referenced document is missing', async () => {
    claimEvidenceLinkFindMany.mockResolvedValue([] as any);
    claimEvidenceFindMany.mockResolvedValue([{ documentId: 'doc_1' }] as any);
    dataLoaders.getDocumentLoader.mockReturnValue({
      load: jest.fn().mockResolvedValue(null),
    } as any);
    await expect(resolver.documents({ id: 'c1' } as any)).rejects.toThrow(
      /missing Document\(doc_1\)/i,
    );
  });

  it('documents resolveField returns docs from links when present', async () => {
    claimEvidenceLinkFindMany.mockResolvedValue([
      { evidence: { sourceDocumentId: 'doc_1' } },
      { evidence: { sourceDocumentId: 'doc_2' } },
    ] as any);
    claimEvidenceFindMany.mockResolvedValue([] as any);
    const load = jest
      .fn()
      .mockImplementation(async (id: string) => ({ id }) as any);
    dataLoaders.getDocumentLoader.mockReturnValue({ load } as any);

    const result = await resolver.documents({ id: 'c1' } as any);
    expect(result).toEqual([{ id: 'doc_1' }, { id: 'doc_2' }]);
    expect(load).toHaveBeenCalledWith('doc_1');
    expect(load).toHaveBeenCalledWith('doc_2');
  });

  it('documents resolveField skips null sourceDocumentId from links', async () => {
    claimEvidenceLinkFindMany.mockResolvedValue([
      { evidence: { sourceDocumentId: 'doc_1' } },
      { evidence: { sourceDocumentId: null } },
    ] as any);
    claimEvidenceFindMany.mockResolvedValue([] as any);
    const load = jest
      .fn()
      .mockImplementation(async (id: string) => ({ id }) as any);
    dataLoaders.getDocumentLoader.mockReturnValue({ load } as any);

    const result = await resolver.documents({ id: 'c1' } as any);
    expect(result).toEqual([{ id: 'doc_1' }]);
    expect(load).toHaveBeenCalledTimes(1);
    expect(load).toHaveBeenCalledWith('doc_1');
  });

  it('documents resolveField merges docs from both links and legacy', async () => {
    claimEvidenceLinkFindMany.mockResolvedValue([
      { evidence: { sourceDocumentId: 'doc_from_link' } },
    ] as any);
    claimEvidenceFindMany.mockResolvedValue([
      { documentId: 'doc_from_legacy' },
    ] as any);
    const load = jest
      .fn()
      .mockImplementation(async (id: string) => ({ id }) as any);
    dataLoaders.getDocumentLoader.mockReturnValue({ load } as any);

    const result = await resolver.documents({ id: 'c1' } as any);
    expect(result).toHaveLength(2);
    expect(result.map((d: any) => d.id)).toEqual([
      'doc_from_link',
      'doc_from_legacy',
    ]);
  });

  it('documents resolveField returns deduped documents in stable order', async () => {
    claimEvidenceLinkFindMany.mockResolvedValue([] as any);
    claimEvidenceFindMany.mockResolvedValue([
      { documentId: 'doc_1' },
      { documentId: 'doc_2' },
      { documentId: 'doc_1' },
    ] as any);
    const load = jest
      .fn()
      .mockImplementation(async (id: string) => ({ id }) as any);
    dataLoaders.getDocumentLoader.mockReturnValue({ load } as any);

    const result = await resolver.documents({ id: 'c1' } as any);
    expect(result).toEqual([{ id: 'doc_1' }, { id: 'doc_2' }]);
    expect(load).toHaveBeenCalledTimes(2);
    expect(load).toHaveBeenNthCalledWith(1, 'doc_1');
    expect(load).toHaveBeenNthCalledWith(2, 'doc_2');
  });
});
