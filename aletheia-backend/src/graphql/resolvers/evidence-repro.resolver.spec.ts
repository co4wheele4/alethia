import { EvidenceReproResolver } from './evidence-repro.resolver';
import { PrismaService } from '@prisma/prisma.service';
import { GQL_ERROR_CODES } from '../errors/graphql-error-codes';

describe('EvidenceReproResolver', () => {
  let resolver: EvidenceReproResolver;
  let evidenceFindFirst: jest.Mock;
  let reproFindMany: jest.Mock;

  beforeEach(() => {
    evidenceFindFirst = jest.fn();
    reproFindMany = jest.fn();
    const prisma = {
      evidence: { findFirst: evidenceFindFirst },
      evidenceReproCheck: { findMany: reproFindMany },
    };
    resolver = new EvidenceReproResolver(prisma as unknown as PrismaService);
  });

  it('requires auth', async () => {
    await expect(
      resolver.evidenceReproChecks('e1', {} as any),
    ).rejects.toMatchObject({
      extensions: { code: GQL_ERROR_CODES.UNAUTHORIZED },
    });
  });

  it('returns rows when evidence visible', async () => {
    evidenceFindFirst.mockResolvedValue({ id: 'e1' });
    reproFindMany.mockResolvedValue([{ id: 'r1', evidenceId: 'e1' }]);

    const rows = await resolver.evidenceReproChecks('e1', {
      req: { user: { sub: 'u1' } },
    } as any);
    expect(rows).toHaveLength(1);
  });

  it('EVIDENCE_NOT_FOUND when missing', async () => {
    evidenceFindFirst.mockResolvedValue(null);
    await expect(
      resolver.evidenceReproChecks('e1', {
        req: { user: { sub: 'u1' } },
      } as any),
    ).rejects.toMatchObject({
      extensions: { code: GQL_ERROR_CODES.EVIDENCE_NOT_FOUND },
    });
  });
});
