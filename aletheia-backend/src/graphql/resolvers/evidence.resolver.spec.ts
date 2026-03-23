import { EvidenceResolver } from './evidence.resolver';
import { PrismaService } from '@prisma/prisma.service';
import { GQL_ERROR_CODES } from '../errors/graphql-error-codes';
import { CreateEvidenceSourceKindInput } from '@inputs/evidence.input';

describe('EvidenceResolver', () => {
  let resolver: EvidenceResolver;
  let prisma: PrismaService;
  let evidenceFindMany: jest.Mock;
  let evidenceFindUnique: jest.Mock;
  let evidenceCreate: jest.Mock;
  let claimEvidenceLinkUpsert: jest.Mock;
  let documentFindUnique: jest.Mock;
  let documentChunkFindUnique: jest.Mock;
  let claimFindUnique: jest.Mock;

  const ctx = { req: { user: { sub: 'u1' } } };

  beforeEach(() => {
    evidenceFindMany = jest.fn();
    evidenceFindUnique = jest.fn();
    evidenceCreate = jest.fn();
    claimEvidenceLinkUpsert = jest.fn();
    documentFindUnique = jest.fn();
    documentChunkFindUnique = jest.fn();
    claimFindUnique = jest.fn();

    prisma = {
      evidence: {
        findMany: evidenceFindMany,
        findUnique: evidenceFindUnique,
        create: evidenceCreate,
      },
      claimEvidenceLink: { upsert: claimEvidenceLinkUpsert },
      document: { findUnique: documentFindUnique },
      documentChunk: { findUnique: documentChunkFindUnique },
      claim: { findUnique: claimFindUnique },
      user: { findUniqueOrThrow: jest.fn().mockResolvedValue({ id: 'u1' }) },
    } as unknown as PrismaService;

    resolver = new EvidenceResolver(prisma);
  });

  it('evidence returns empty when unauthenticated', async () => {
    const result = await resolver.evidence({} as any);
    expect(result).toEqual([]);
    expect(evidenceFindMany).not.toHaveBeenCalled();
  });

  it('evidence queries by sourceDocument.userId when authenticated', async () => {
    evidenceFindMany.mockResolvedValue([{ id: 'e1' }] as any);
    const result = await resolver.evidence(ctx as any);
    expect(result).toEqual([{ id: 'e1' }]);
    expect(evidenceFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { sourceDocument: { userId: 'u1' } },
      }),
    );
  });

  it('createEvidence rejects EVIDENCE_SOURCE_REQUIRED when sourceDocumentId missing', async () => {
    await expect(
      resolver.createEvidence(
        {
          sourceType: CreateEvidenceSourceKindInput.DOCUMENT,
          chunkId: 'ch1',
          startOffset: 0,
          endOffset: 10,
        } as any,
        ctx as any,
      ),
    ).rejects.toMatchObject({
      extensions: { code: GQL_ERROR_CODES.EVIDENCE_SOURCE_REQUIRED },
    });
  });

  it('createEvidence rejects EVIDENCE_LOCATOR_REQUIRED when locator missing', async () => {
    documentFindUnique.mockResolvedValue({ id: 'doc1', userId: 'u1' });
    await expect(
      resolver.createEvidence(
        {
          sourceType: CreateEvidenceSourceKindInput.DOCUMENT,
          sourceDocumentId: 'doc1',
        } as any,
        ctx as any,
      ),
    ).rejects.toMatchObject({
      extensions: { code: GQL_ERROR_CODES.EVIDENCE_LOCATOR_REQUIRED },
    });
  });

  it('createEvidence rejects EVIDENCE_MALFORMED_OFFSETS when end <= start', async () => {
    documentFindUnique.mockResolvedValue({ id: 'doc1', userId: 'u1' });
    documentChunkFindUnique.mockResolvedValue({
      id: 'ch1',
      documentId: 'doc1',
      content: 'hello world',
    });
    await expect(
      resolver.createEvidence(
        {
          sourceType: CreateEvidenceSourceKindInput.DOCUMENT,
          sourceDocumentId: 'doc1',
          chunkId: 'ch1',
          startOffset: 10,
          endOffset: 5,
        } as any,
        ctx as any,
      ),
    ).rejects.toMatchObject({
      extensions: { code: GQL_ERROR_CODES.EVIDENCE_MALFORMED_OFFSETS },
    });
  });

  it('createEvidence rejects EVIDENCE_SOURCE_NOT_FOUND when document missing', async () => {
    documentFindUnique.mockResolvedValue(null);
    await expect(
      resolver.createEvidence(
        {
          sourceType: CreateEvidenceSourceKindInput.DOCUMENT,
          sourceDocumentId: 'doc_missing',
          chunkId: 'ch1',
          startOffset: 0,
          endOffset: 10,
        } as any,
        ctx as any,
      ),
    ).rejects.toMatchObject({
      extensions: { code: GQL_ERROR_CODES.EVIDENCE_SOURCE_NOT_FOUND },
    });
  });

  it('createEvidence rejects EVIDENCE_CHUNK_NOT_IN_SOURCE when chunk belongs to other doc', async () => {
    documentFindUnique.mockResolvedValue({ id: 'doc1', userId: 'u1' });
    documentChunkFindUnique.mockResolvedValue({
      id: 'ch1',
      documentId: 'doc_other',
      content: 'hello',
    });
    await expect(
      resolver.createEvidence(
        {
          sourceType: CreateEvidenceSourceKindInput.DOCUMENT,
          sourceDocumentId: 'doc1',
          chunkId: 'ch1',
          startOffset: 0,
          endOffset: 5,
        } as any,
        ctx as any,
      ),
    ).rejects.toMatchObject({
      extensions: { code: GQL_ERROR_CODES.EVIDENCE_CHUNK_NOT_IN_SOURCE },
    });
  });

  it('createEvidence creates evidence and optionally links to claims', async () => {
    documentFindUnique.mockResolvedValue({ id: 'doc1', userId: 'u1' });
    documentChunkFindUnique.mockResolvedValue({
      id: 'ch1',
      documentId: 'doc1',
      content: 'hello world',
    });
    evidenceCreate.mockResolvedValue({
      id: 'ev1',
      sourceDocumentId: 'doc1',
      chunkId: 'ch1',
      startOffset: 0,
      endOffset: 5,
    });
    claimFindUnique.mockResolvedValue({ id: 'c1' });

    const result = await resolver.createEvidence(
      {
        sourceType: CreateEvidenceSourceKindInput.DOCUMENT,
        sourceDocumentId: 'doc1',
        chunkId: 'ch1',
        startOffset: 0,
        endOffset: 5,
        claimIds: ['c1'],
      } as any,
      ctx as any,
    );

    expect(result.id).toBe('ev1');
    expect(evidenceCreate).toHaveBeenCalled();
    expect(claimEvidenceLinkUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { evidenceId_claimId: { evidenceId: 'ev1', claimId: 'c1' } },
        create: { evidenceId: 'ev1', claimId: 'c1' },
      }),
    );
  });

  it('linkEvidenceToClaim rejects when evidence not found', async () => {
    evidenceFindUnique.mockResolvedValue(null);
    await expect(
      resolver.linkEvidenceToClaim('ev1', 'c1', ctx as any),
    ).rejects.toMatchObject({
      extensions: { code: GQL_ERROR_CODES.EVIDENCE_NOT_FOUND },
    });
  });

  it('linkEvidenceToClaim links evidence to claim', async () => {
    evidenceFindUnique.mockResolvedValue({
      id: 'ev1',
      sourceDocument: { userId: 'u1' },
    });
    claimFindUnique.mockResolvedValue({ id: 'c1' });
    claimEvidenceLinkUpsert.mockResolvedValue({});

    const result = await resolver.linkEvidenceToClaim('ev1', 'c1', ctx as any);
    expect(result.id).toBe('ev1');
    expect(claimEvidenceLinkUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { evidenceId_claimId: { evidenceId: 'ev1', claimId: 'c1' } },
        create: { evidenceId: 'ev1', claimId: 'c1' },
      }),
    );
  });
});
