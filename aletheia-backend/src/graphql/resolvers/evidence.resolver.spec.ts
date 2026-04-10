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

  it('evidenceById returns evidence when found', async () => {
    evidenceFindUnique.mockResolvedValue({
      id: 'e1',
      sourceType: 'DOCUMENT',
      createdBy: 'u1',
      sourceDocument: { userId: 'u1' },
    } as any);
    const result = await resolver.evidenceById('e1', ctx as any);
    expect(result).toMatchObject({ id: 'e1' });
    expect(evidenceFindUnique).toHaveBeenCalledWith({
      where: { id: 'e1' },
      include: { sourceDocument: { select: { userId: true } } },
    });
  });

  it('evidenceById returns null when not found', async () => {
    evidenceFindUnique.mockResolvedValue(null);
    const result = await resolver.evidenceById('e_missing', ctx as any);
    expect(result).toBeNull();
  });

  it('evidenceById returns null when unauthenticated', async () => {
    evidenceFindUnique.mockResolvedValue({ id: 'e1' } as any);
    const result = await resolver.evidenceById('e1', {} as any);
    expect(result).toBeNull();
    expect(evidenceFindUnique).not.toHaveBeenCalled();
  });

  it('evidenceById returns null when sourceType is not DOCUMENT or URL', async () => {
    evidenceFindUnique.mockResolvedValue({
      id: 'e1',
      sourceType: 'OTHER',
      createdBy: 'u1',
      sourceDocument: null,
    } as any);
    const result = await resolver.evidenceById('e1', ctx as any);
    expect(result).toBeNull();
  });

  it('evidenceById returns null when URL evidence was created by another user', async () => {
    evidenceFindUnique.mockResolvedValue({
      id: 'e1',
      sourceType: 'URL',
      createdBy: 'other',
      sourceDocument: null,
    } as any);
    const result = await resolver.evidenceById('e1', ctx as any);
    expect(result).toBeNull();
  });

  it('evidenceById returns null for unknown source kinds', async () => {
    evidenceFindUnique.mockResolvedValue({
      id: 'e1',
      sourceType: 'UNKNOWN_KIND',
      createdBy: 'u1',
      sourceDocument: null,
    } as any);
    const result = await resolver.evidenceById('e1', ctx as any);
    expect(result).toBeNull();
  });

  it('evidenceById returns null for legacy DB-only source kinds (e.g. HTML_PAGE)', async () => {
    evidenceFindUnique.mockResolvedValue({
      id: 'e1',
      sourceType: 'HTML_PAGE',
      createdBy: 'u1',
      sourceDocument: null,
    } as any);
    const result = await resolver.evidenceById('e1', ctx as any);
    expect(result).toBeNull();
  });

  it('evidenceById returns null when DOCUMENT evidence is not in the user workspace', async () => {
    evidenceFindUnique.mockResolvedValue({
      id: 'e1',
      sourceType: 'DOCUMENT',
      createdBy: 'u1',
      sourceDocument: { userId: 'other' },
    } as any);
    const result = await resolver.evidenceById('e1', ctx as any);
    expect(result).toBeNull();
  });

  it('createEvidence rejects UNAUTHORIZED when no user in context', async () => {
    await expect(
      resolver.createEvidence(
        {
          sourceType: CreateEvidenceSourceKindInput.DOCUMENT,
          sourceDocumentId: 'doc1',
          chunkId: 'ch1',
          startOffset: 0,
          endOffset: 5,
        } as any,
        {} as any,
      ),
    ).rejects.toMatchObject({
      extensions: { code: GQL_ERROR_CODES.UNAUTHORIZED },
    });
  });

  it('createEvidence rejects EVIDENCE_SOURCE_REQUIRED for URL without sourceUrl', async () => {
    await expect(
      resolver.createEvidence(
        {
          sourceType: CreateEvidenceSourceKindInput.URL,
        } as any,
        ctx as any,
      ),
    ).rejects.toMatchObject({
      extensions: { code: GQL_ERROR_CODES.EVIDENCE_SOURCE_REQUIRED },
    });
  });

  it('createEvidence rejects EVIDENCE_SOURCE_REQUIRED for URL source', async () => {
    await expect(
      resolver.createEvidence(
        {
          sourceType: CreateEvidenceSourceKindInput.URL,
          sourceUrl: 'https://example.com',
        } as any,
        ctx as any,
      ),
    ).rejects.toMatchObject({
      extensions: { code: GQL_ERROR_CODES.EVIDENCE_SOURCE_REQUIRED },
    });
  });

  it('createEvidence rejects UNAUTHORIZED when document belongs to another user', async () => {
    documentFindUnique.mockResolvedValue({ id: 'doc1', userId: 'other' });
    await expect(
      resolver.createEvidence(
        {
          sourceType: CreateEvidenceSourceKindInput.DOCUMENT,
          sourceDocumentId: 'doc1',
          chunkId: 'ch1',
          startOffset: 0,
          endOffset: 5,
          snippet: 'hello',
        } as any,
        ctx as any,
      ),
    ).rejects.toMatchObject({
      extensions: { code: GQL_ERROR_CODES.UNAUTHORIZED },
    });
  });

  it('createEvidence rejects EVIDENCE_MALFORMED_OFFSETS when snippet does not match content', async () => {
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
          startOffset: 0,
          endOffset: 5,
          snippet: 'wrong',
        } as any,
        ctx as any,
      ),
    ).rejects.toMatchObject({
      extensions: { code: GQL_ERROR_CODES.EVIDENCE_MALFORMED_OFFSETS },
    });
  });

  it('createEvidence rejects EVIDENCE_MALFORMED_OFFSETS when offsets out of range', async () => {
    documentFindUnique.mockResolvedValue({ id: 'doc1', userId: 'u1' });
    documentChunkFindUnique.mockResolvedValue({
      id: 'ch1',
      documentId: 'doc1',
      content: 'hello',
    });
    await expect(
      resolver.createEvidence(
        {
          sourceType: CreateEvidenceSourceKindInput.DOCUMENT,
          sourceDocumentId: 'doc1',
          chunkId: 'ch1',
          startOffset: 0,
          endOffset: 100,
        } as any,
        ctx as any,
      ),
    ).rejects.toMatchObject({
      extensions: { code: GQL_ERROR_CODES.EVIDENCE_MALFORMED_OFFSETS },
    });
  });

  it('createEvidence accepts valid snippet matching content', async () => {
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

    const result = await resolver.createEvidence(
      {
        sourceType: CreateEvidenceSourceKindInput.DOCUMENT,
        sourceDocumentId: 'doc1',
        chunkId: 'ch1',
        startOffset: 0,
        endOffset: 5,
        snippet: 'hello',
      } as any,
      ctx as any,
    );
    expect(result.id).toBe('ev1');
  });

  it('createEvidence with snippet validation enters extractSpan and succeeds when snippet matches', async () => {
    documentFindUnique.mockResolvedValue({ id: 'doc1', userId: 'u1' });
    documentChunkFindUnique.mockResolvedValue({
      id: 'ch1',
      documentId: 'doc1',
      content: 'abcdef',
    });
    evidenceCreate.mockResolvedValue({
      id: 'ev1',
      sourceDocumentId: 'doc1',
      chunkId: 'ch1',
      startOffset: 2,
      endOffset: 5,
    });

    const result = await resolver.createEvidence(
      {
        sourceType: CreateEvidenceSourceKindInput.DOCUMENT,
        sourceDocumentId: 'doc1',
        chunkId: 'ch1',
        startOffset: 2,
        endOffset: 5,
        snippet: 'cde',
      } as any,
      ctx as any,
    );
    expect(result.id).toBe('ev1');
  });

  it('createEvidence skips claim linking when claimIds is empty array', async () => {
    documentFindUnique.mockResolvedValue({ id: 'doc1', userId: 'u1' });
    documentChunkFindUnique.mockResolvedValue({
      id: 'ch1',
      documentId: 'doc1',
      content: 'x',
    });
    evidenceCreate.mockResolvedValue({
      id: 'ev1',
      sourceDocumentId: 'doc1',
      chunkId: 'ch1',
      startOffset: 0,
      endOffset: 1,
    });

    const result = await resolver.createEvidence(
      {
        sourceType: CreateEvidenceSourceKindInput.DOCUMENT,
        sourceDocumentId: 'doc1',
        chunkId: 'ch1',
        startOffset: 0,
        endOffset: 1,
        snippet: 'x',
        claimIds: [],
      } as any,
      ctx as any,
    );
    expect(result.id).toBe('ev1');
    expect(claimFindUnique).not.toHaveBeenCalled();
    expect(claimEvidenceLinkUpsert).not.toHaveBeenCalled();
  });

  it('linkEvidenceToClaim rejects when claim not found', async () => {
    evidenceFindUnique.mockResolvedValue({
      id: 'ev1',
      sourceType: 'DOCUMENT',
      sourceDocument: { userId: 'u1' },
    });
    claimFindUnique.mockResolvedValue(null);
    await expect(
      resolver.linkEvidenceToClaim('ev1', 'c_missing', ctx as any),
    ).rejects.toMatchObject({
      extensions: { code: GQL_ERROR_CODES.CLAIM_NOT_FOUND },
    });
  });

  it('linkEvidenceToClaim rejects when evidence has no source document', async () => {
    evidenceFindUnique.mockResolvedValue({
      id: 'ev1',
      sourceType: 'DOCUMENT',
      sourceDocument: null,
    });
    await expect(
      resolver.linkEvidenceToClaim('ev1', 'c1', ctx as any),
    ).rejects.toMatchObject({
      extensions: { code: GQL_ERROR_CODES.UNAUTHORIZED },
    });
  });

  it('linkEvidenceToClaim rejects when evidence belongs to another user', async () => {
    evidenceFindUnique.mockResolvedValue({
      id: 'ev1',
      sourceType: 'DOCUMENT',
      sourceDocument: { userId: 'other' },
    });
    await expect(
      resolver.linkEvidenceToClaim('ev1', 'c1', ctx as any),
    ).rejects.toMatchObject({
      extensions: { code: GQL_ERROR_CODES.UNAUTHORIZED },
    });
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
        where: {
          OR: [
            { sourceDocument: { userId: 'u1' } },
            {
              sourceType: { in: ['URL', 'HTML_PAGE'] },
              createdBy: 'u1',
            },
          ],
        },
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

  it('createEvidence rejects EVIDENCE_SOURCE_NOT_FOUND when chunk does not exist', async () => {
    documentFindUnique.mockResolvedValue({ id: 'doc1', userId: 'u1' });
    documentChunkFindUnique.mockResolvedValue(null);
    await expect(
      resolver.createEvidence(
        {
          sourceType: CreateEvidenceSourceKindInput.DOCUMENT,
          sourceDocumentId: 'doc1',
          chunkId: 'ch_missing',
          startOffset: 0,
          endOffset: 5,
        } as any,
        ctx as any,
      ),
    ).rejects.toMatchObject({
      extensions: { code: GQL_ERROR_CODES.EVIDENCE_SOURCE_NOT_FOUND },
    });
  });

  it('createEvidence rejects EVIDENCE_MALFORMED_OFFSETS when startOffset is negative', async () => {
    documentFindUnique.mockResolvedValue({ id: 'doc1', userId: 'u1' });
    documentChunkFindUnique.mockResolvedValue({
      id: 'ch1',
      documentId: 'doc1',
      content: 'hello',
    });
    await expect(
      resolver.createEvidence(
        {
          sourceType: CreateEvidenceSourceKindInput.DOCUMENT,
          sourceDocumentId: 'doc1',
          chunkId: 'ch1',
          startOffset: -1,
          endOffset: 2,
        } as any,
        ctx as any,
      ),
    ).rejects.toMatchObject({
      extensions: { code: GQL_ERROR_CODES.EVIDENCE_MALFORMED_OFFSETS },
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

  it('createEvidence rejects EVIDENCE_VERBATIM_REQUIRED when snippet is empty string (ADR-024)', async () => {
    documentFindUnique.mockResolvedValue({ id: 'doc1', userId: 'u1' });
    documentChunkFindUnique.mockResolvedValue({
      id: 'ch1',
      documentId: 'doc1',
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
          snippet: '',
        } as any,
        ctx as any,
      ),
    ).rejects.toMatchObject({
      extensions: { code: GQL_ERROR_CODES.EVIDENCE_VERBATIM_REQUIRED },
    });
  });

  it('createEvidence rejects EVIDENCE_VERBATIM_REQUIRED when snippet is omitted (ADR-024)', async () => {
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
          startOffset: 0,
          endOffset: 5,
        } as any,
        ctx as any,
      ),
    ).rejects.toMatchObject({
      extensions: { code: GQL_ERROR_CODES.EVIDENCE_VERBATIM_REQUIRED },
    });
  });

  it('createEvidence links only to existing claims when claimIds include missing', async () => {
    documentFindUnique.mockResolvedValue({ id: 'doc1', userId: 'u1' });
    documentChunkFindUnique.mockResolvedValue({
      id: 'ch1',
      documentId: 'doc1',
      content: 'hello',
    });
    evidenceCreate.mockResolvedValue({
      id: 'ev1',
      sourceDocumentId: 'doc1',
      chunkId: 'ch1',
      startOffset: 0,
      endOffset: 5,
    });
    claimFindUnique
      .mockResolvedValueOnce({ id: 'c1' })
      .mockResolvedValueOnce(null);

    const result = await resolver.createEvidence(
      {
        sourceType: CreateEvidenceSourceKindInput.DOCUMENT,
        sourceDocumentId: 'doc1',
        chunkId: 'ch1',
        startOffset: 0,
        endOffset: 5,
        snippet: 'hello',
        claimIds: ['c1', 'c_missing'],
      } as any,
      ctx as any,
    );

    expect(result.id).toBe('ev1');
    expect(claimEvidenceLinkUpsert).toHaveBeenCalledTimes(1);
    expect(claimEvidenceLinkUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { evidenceId_claimId: { evidenceId: 'ev1', claimId: 'c1' } },
      }),
    );
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
        snippet: 'hello',
        claimIds: ['c1'],
      } as any,
      ctx as any,
    );

    expect(result.id).toBe('ev1');
    expect(evidenceCreate).toHaveBeenCalled();
    expect(evidenceCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          contentSha256: expect.any(String),
          snippet: 'hello',
        }),
      }),
    );
    expect(claimEvidenceLinkUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { evidenceId_claimId: { evidenceId: 'ev1', claimId: 'c1' } },
        create: { evidenceId: 'ev1', claimId: 'c1' },
      }),
    );
  });

  it('linkEvidenceToClaim rejects UNAUTHORIZED when no user in context', async () => {
    await expect(
      resolver.linkEvidenceToClaim('ev1', 'c1', {} as any),
    ).rejects.toMatchObject({
      extensions: { code: GQL_ERROR_CODES.UNAUTHORIZED },
    });
  });

  it('linkEvidenceToClaim rejects when evidence not found', async () => {
    evidenceFindUnique.mockResolvedValue(null);
    await expect(
      resolver.linkEvidenceToClaim('ev1', 'c1', ctx as any),
    ).rejects.toMatchObject({
      extensions: { code: GQL_ERROR_CODES.EVIDENCE_NOT_FOUND },
    });
  });

  it('createdByUser resolveField loads user', async () => {
    const userFindUniqueOrThrow = jest.fn().mockResolvedValue({ id: 'u1' });
    (prisma as any).user = { findUniqueOrThrow: userFindUniqueOrThrow };
    const result = await resolver.createdByUser({ createdBy: 'u1' } as any);
    expect(result).toEqual({ id: 'u1' });
    expect(userFindUniqueOrThrow).toHaveBeenCalledWith({
      where: { id: 'u1' },
    });
  });

  it('sourceDocument resolveField returns null when no sourceDocumentId', async () => {
    const result = await resolver.sourceDocument({
      sourceDocumentId: null,
    } as any);
    expect(result).toBeNull();
    expect(documentFindUnique).not.toHaveBeenCalled();
  });

  it('sourceDocument resolveField loads document when sourceDocumentId present', async () => {
    documentFindUnique.mockResolvedValue({ id: 'doc1' } as any);
    const result = await resolver.sourceDocument({
      sourceDocumentId: 'doc1',
    } as any);
    expect(result).toEqual({ id: 'doc1' });
    expect(documentFindUnique).toHaveBeenCalledWith({
      where: { id: 'doc1' },
    });
  });

  it('chunk resolveField returns null when no chunkId', async () => {
    const result = await resolver.chunk({ chunkId: null } as any);
    expect(result).toBeNull();
    expect(documentChunkFindUnique).not.toHaveBeenCalled();
  });

  it('chunk resolveField loads chunk when chunkId present', async () => {
    documentChunkFindUnique.mockResolvedValue({ id: 'ch1' } as any);
    const result = await resolver.chunk({ chunkId: 'ch1' } as any);
    expect(result).toEqual({ id: 'ch1' });
    expect(documentChunkFindUnique).toHaveBeenCalledWith({
      where: { id: 'ch1' },
    });
  });

  it('linkEvidenceToClaim links evidence to claim', async () => {
    evidenceFindUnique.mockResolvedValue({
      id: 'ev1',
      sourceType: 'DOCUMENT',
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

  it('linkEvidenceToClaim links URL evidence owned by user', async () => {
    evidenceFindUnique.mockResolvedValue({
      id: 'ev1',
      sourceType: 'URL',
      createdBy: 'u1',
      sourceDocument: null,
    });
    claimFindUnique.mockResolvedValue({ id: 'c1' });
    claimEvidenceLinkUpsert.mockResolvedValue({});

    const result = await resolver.linkEvidenceToClaim('ev1', 'c1', ctx as any);
    expect(result.id).toBe('ev1');
    expect(claimEvidenceLinkUpsert).toHaveBeenCalled();
  });

  it('linkEvidenceToClaim rejects when URL evidence was created by another user', async () => {
    evidenceFindUnique.mockResolvedValue({
      id: 'ev1',
      sourceType: 'URL',
      createdBy: 'other',
      sourceDocument: null,
    });
    await expect(
      resolver.linkEvidenceToClaim('ev1', 'c1', ctx as any),
    ).rejects.toMatchObject({
      extensions: { code: GQL_ERROR_CODES.UNAUTHORIZED },
    });
    expect(claimEvidenceLinkUpsert).not.toHaveBeenCalled();
  });

  it('linkEvidenceToClaim rejects legacy DB-only evidence kinds not in GraphQL', async () => {
    evidenceFindUnique.mockResolvedValue({
      id: 'ev1',
      sourceType: 'HTML_PAGE',
      createdBy: 'u1',
      sourceDocument: null,
    });
    await expect(
      resolver.linkEvidenceToClaim('ev1', 'c1', ctx as any),
    ).rejects.toMatchObject({
      extensions: { code: GQL_ERROR_CODES.UNAUTHORIZED },
    });
    expect(claimEvidenceLinkUpsert).not.toHaveBeenCalled();
  });
});
