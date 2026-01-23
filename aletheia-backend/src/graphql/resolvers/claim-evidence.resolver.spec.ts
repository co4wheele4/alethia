import { PrismaService } from '@prisma/prisma.service';
import { ClaimEvidenceResolver } from './claim-evidence.resolver';

describe('ClaimEvidenceResolver', () => {
  let resolver: ClaimEvidenceResolver;
  let prisma: PrismaService;
  let mentionFindMany: jest.Mock;
  let relationshipFindMany: jest.Mock;

  beforeEach(() => {
    mentionFindMany = jest.fn();
    relationshipFindMany = jest.fn();
    prisma = {
      claimEvidenceMention: { findMany: mentionFindMany },
      claimEvidenceRelationship: { findMany: relationshipFindMany },
    } as unknown as PrismaService;

    resolver = new ClaimEvidenceResolver(prisma);
  });

  it('mentionIds returns mention ids (and enforces at least one id across both categories)', async () => {
    mentionFindMany.mockResolvedValue([{ mentionId: 'm1' }] as any);
    relationshipFindMany.mockResolvedValue([] as any);

    const result = await resolver.mentionIds({ id: 'ev1' } as any);
    expect(result).toEqual(['m1']);
  });

  it('relationshipIds returns relationship ids (and enforces at least one id across both categories)', async () => {
    mentionFindMany.mockResolvedValue([] as any);
    relationshipFindMany.mockResolvedValue([{ relationshipId: 'r1' }] as any);

    const result = await resolver.relationshipIds({ id: 'ev1' } as any);
    expect(result).toEqual(['r1']);
  });

  it('fails when evidence has neither mentionIds nor relationshipIds', async () => {
    mentionFindMany.mockResolvedValue([] as any);
    relationshipFindMany.mockResolvedValue([] as any);

    await expect(resolver.mentionIds({ id: 'ev1' } as any)).rejects.toThrow(
      /must reference mentionIds and\/or relationshipIds/i,
    );
    await expect(
      resolver.relationshipIds({ id: 'ev1' } as any),
    ).rejects.toThrow(/must reference mentionIds and\/or relationshipIds/i);
  });
});
