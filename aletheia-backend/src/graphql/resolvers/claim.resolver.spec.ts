import { ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { DataLoaderService } from '@common/dataloaders/dataloader.service';
import { ClaimResolver } from './claim.resolver';

describe('ClaimResolver', () => {
  let resolver: ClaimResolver;
  let prisma: PrismaService;
  let dataLoaders: jest.Mocked<DataLoaderService>;
  let claimFindMany: jest.Mock;
  let claimEvidenceFindMany: jest.Mock;
  let documentFindUnique: jest.Mock;

  beforeEach(() => {
    claimFindMany = jest.fn();
    claimEvidenceFindMany = jest.fn();
    documentFindUnique = jest.fn();

    prisma = {
      claim: { findMany: claimFindMany },
      claimEvidence: { findMany: claimEvidenceFindMany },
      document: { findUnique: documentFindUnique },
    } as unknown as PrismaService;

    dataLoaders = {
      getDocumentLoader: jest.fn(),
    } as unknown as jest.Mocked<DataLoaderService>;

    resolver = new ClaimResolver(prisma, dataLoaders);
  });

  it('claims returns empty list when unauthenticated', async () => {
    const result = await resolver.claims({ req: { user: {} } } as any);
    expect(result).toEqual([]);
    expect(claimFindMany).not.toHaveBeenCalled();
  });

  it('claims queries by evidence->document.userId when authenticated', async () => {
    claimFindMany.mockResolvedValue([{ id: 'c1' }] as any);
    const result = await resolver.claims({
      req: { user: { sub: 'u1' } },
    } as any);
    expect(result).toEqual([{ id: 'c1' }]);
    expect(claimFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { evidence: { some: { document: { userId: 'u1' } } } },
      }),
    );
  });

  it('claimsByDocument returns empty list when unauthenticated', async () => {
    const result = await resolver.claimsByDocument('doc_1', {
      req: { user: {} },
    } as any);
    expect(result).toEqual([]);
    expect(documentFindUnique).not.toHaveBeenCalled();
  });

  it('claimsByDocument returns empty list when document does not exist', async () => {
    documentFindUnique.mockResolvedValue(null as any);
    const result = await resolver.claimsByDocument('doc_1', {
      req: { user: { sub: 'u1' } },
    } as any);
    expect(result).toEqual([]);
  });

  it('claimsByDocument forbids access when document belongs to another user', async () => {
    documentFindUnique.mockResolvedValue({
      id: 'doc_1',
      userId: 'other',
    } as any);
    await expect(
      resolver.claimsByDocument('doc_1', {
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
    const result = await resolver.claimsByDocument('doc_1', {
      req: { user: { sub: 'u1' } },
    } as any);
    expect(result).toEqual([{ id: 'c1' }]);
    expect(claimFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { evidence: { some: { documentId: 'doc_1' } } },
      }),
    );
  });

  it('evidence resolveField fails when claim has no evidence', async () => {
    claimEvidenceFindMany.mockResolvedValue([] as any);
    await expect(resolver.evidence({ id: 'c1' } as any)).rejects.toThrow(
      /Claim\(c1\).*no evidence anchors/i,
    );
  });

  it('evidence resolveField returns evidence anchors when present', async () => {
    claimEvidenceFindMany.mockResolvedValue([{ id: 'ev1' }] as any);
    const result = await resolver.evidence({ id: 'c1' } as any);
    expect(result).toEqual([{ id: 'ev1' }]);
  });

  it('documents resolveField fails when documents cannot be derived (no evidence)', async () => {
    claimEvidenceFindMany.mockResolvedValue([] as any);
    await expect(resolver.documents({ id: 'c1' } as any)).rejects.toThrow(
      /documents cannot be derived/i,
    );
  });

  it('documents resolveField fails when referenced document is missing', async () => {
    claimEvidenceFindMany.mockResolvedValue([{ documentId: 'doc_1' }] as any);
    dataLoaders.getDocumentLoader.mockReturnValue({
      load: jest.fn().mockResolvedValue(null),
    } as any);
    await expect(resolver.documents({ id: 'c1' } as any)).rejects.toThrow(
      /missing Document\(doc_1\)/i,
    );
  });

  it('documents resolveField returns deduped documents in stable order', async () => {
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
