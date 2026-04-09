import { EvidenceReproCheckService } from './evidence-repro-check.service';
import { EvidenceSourceKind } from '@prisma/client';

describe('EvidenceReproCheckService', () => {
  let service: EvidenceReproCheckService;
  let evidenceFindUnique: jest.Mock;
  let evidenceFindMany: jest.Mock;
  let evidenceReproCheckCreate: jest.Mock;
  let evidenceReproCheckFindFirst: jest.Mock;

  beforeEach(() => {
    evidenceFindUnique = jest.fn();
    evidenceFindMany = jest.fn();
    evidenceReproCheckCreate = jest.fn();
    evidenceReproCheckFindFirst = jest.fn();
    const prisma = {
      evidence: {
        findUnique: evidenceFindUnique,
        findMany: evidenceFindMany,
      },
      evidenceReproCheck: {
        create: evidenceReproCheckCreate,
        findFirst: evidenceReproCheckFindFirst,
      },
    };
    service = new EvidenceReproCheckService(prisma as any);
  });

  it('records FAILED for non-URL evidence', async () => {
    evidenceFindUnique.mockResolvedValue({
      id: 'e1',
      sourceType: EvidenceSourceKind.DOCUMENT,
      sourceUrl: null,
      contentSha256: null,
    });
    evidenceReproCheckCreate.mockResolvedValue({ id: 'r1' });

    const row = await service.runCheckForEvidenceId('e1');
    expect(row.id).toBe('r1');
    expect(evidenceReproCheckCreate).toHaveBeenCalled();
  });

  it('records fetch result for URL evidence', async () => {
    evidenceFindUnique.mockResolvedValue({
      id: 'e1',
      sourceType: EvidenceSourceKind.URL,
      sourceUrl: 'https://example.com/x',
      contentSha256: 'a'.repeat(64),
    });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      arrayBuffer: async () => Buffer.from('body'),
    }) as any;
    evidenceReproCheckCreate.mockImplementation(
      (args: { data: { fetchedHash: string } }) =>
        Promise.resolve({ id: 'r1', ...args.data }),
    );

    const row = await service.runCheckForEvidenceId('e1');
    expect(row.fetchedHash).toBeDefined();
  });

  it('runBatch processes one id', async () => {
    evidenceFindUnique.mockResolvedValue({
      id: 'e1',
      sourceType: EvidenceSourceKind.URL,
      sourceUrl: 'https://example.com/x',
      contentSha256: null,
    });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => Buffer.from('x'),
    }) as any;
    evidenceReproCheckCreate.mockResolvedValue({});

    const r = await service.runBatch({ evidenceId: 'e1' });
    expect(r.processed).toBe(1);
  });

  it('runBatch iterates URL evidence with optional age filter', async () => {
    evidenceFindMany.mockResolvedValue([{ id: 'e1' }]);
    evidenceFindUnique.mockResolvedValue({
      id: 'e1',
      sourceType: EvidenceSourceKind.URL,
      sourceUrl: 'https://example.com/x',
      contentSha256: null,
    });
    evidenceReproCheckFindFirst.mockResolvedValue({
      checkedAt: new Date(Date.now() - 48 * 3600 * 1000),
    });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => Buffer.from('x'),
    }) as any;
    evidenceReproCheckCreate.mockResolvedValue({});

    const r = await service.runBatch({ olderThanHours: 24 });
    expect(r.processed).toBe(1);
  });

  it('runBatch treats olderThanHours 0 as no cutoff', async () => {
    evidenceFindMany.mockResolvedValue([{ id: 'e1' }]);
    evidenceFindUnique.mockResolvedValue({
      id: 'e1',
      sourceType: EvidenceSourceKind.URL,
      sourceUrl: 'https://example.com/x',
      contentSha256: null,
    });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => Buffer.from('x'),
    }) as any;
    evidenceReproCheckCreate.mockResolvedValue({});

    const r = await service.runBatch({ olderThanHours: 0 });
    expect(r.processed).toBe(1);
  });

  it('skips recent checks when olderThanHours is set', async () => {
    evidenceFindMany.mockResolvedValue([{ id: 'e1' }]);
    evidenceReproCheckFindFirst.mockResolvedValue({
      checkedAt: new Date(),
    });

    const r = await service.runBatch({ olderThanHours: 24 });
    expect(r.processed).toBe(0);
  });

  it('records MISMATCH when stored hash differs from fetched body', async () => {
    evidenceFindUnique.mockResolvedValue({
      id: 'e1',
      sourceType: EvidenceSourceKind.URL,
      sourceUrl: 'https://example.com/x',
      contentSha256: 'a'.repeat(64),
    });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      arrayBuffer: async () => Buffer.from('different-bytes'),
    }) as any;
    evidenceReproCheckCreate.mockResolvedValue({});

    await service.runCheckForEvidenceId('e1');
    expect(evidenceReproCheckCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ hashMatch: 'MISMATCH' }),
      }),
    );
  });

  it('records non-OK HTTP as FAILED with hash compare when stored hash set', async () => {
    const { createHash } = await import('crypto');
    const body = Buffer.from('payload');
    const expectedHex = createHash('sha256').update(body).digest('hex');
    evidenceFindUnique.mockResolvedValue({
      id: 'e1',
      sourceType: EvidenceSourceKind.URL,
      sourceUrl: 'https://example.com/x',
      contentSha256: expectedHex,
    });
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      arrayBuffer: async () => body,
    }) as any;
    evidenceReproCheckCreate.mockResolvedValue({});

    await service.runCheckForEvidenceId('e1');
    expect(evidenceReproCheckCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          fetchStatus: 'FAILED',
          hashMatch: 'MATCH',
        }),
      }),
    );
  });

  it('records fetch exception as FAILED', async () => {
    evidenceFindUnique.mockResolvedValue({
      id: 'e1',
      sourceType: EvidenceSourceKind.URL,
      sourceUrl: 'https://example.com/x',
      contentSha256: null,
    });
    global.fetch = jest.fn().mockRejectedValue(new Error('network')) as any;
    evidenceReproCheckCreate.mockResolvedValue({ id: 'r1' });

    await service.runCheckForEvidenceId('e1');
    expect(evidenceReproCheckCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ fetchStatus: 'FAILED' }),
      }),
    );
  });

  it('stringifies non-Error fetch failures', async () => {
    evidenceFindUnique.mockResolvedValue({
      id: 'e1',
      sourceType: EvidenceSourceKind.URL,
      sourceUrl: 'https://example.com/x',
      contentSha256: null,
    });
    global.fetch = jest.fn().mockRejectedValue('weird') as any;
    evidenceReproCheckCreate.mockResolvedValue({});

    await service.runCheckForEvidenceId('e1');
    expect(evidenceReproCheckCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ errorMessage: 'weird' }),
      }),
    );
  });

  it('throws when evidence id missing', async () => {
    evidenceFindUnique.mockResolvedValue(null);
    await expect(service.runCheckForEvidenceId('missing')).rejects.toThrow(
      /not found/,
    );
  });
});
