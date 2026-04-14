import { EpistemicEventsResolver } from './epistemic-events.resolver';
import { PrismaService } from '@prisma/prisma.service';

describe('EpistemicEventsResolver', () => {
  let resolver: EpistemicEventsResolver;
  let findMany: jest.Mock;

  beforeEach(() => {
    findMany = jest.fn();
    const prisma = {
      epistemicEvent: { findMany },
    };
    resolver = new EpistemicEventsResolver(prisma as unknown as PrismaService);
  });

  it('lists with date-only filter', async () => {
    findMany.mockResolvedValue([]);
    await resolver.adminEpistemicEvents({
      createdBefore: new Date(),
    });
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          createdAt: expect.any(Object),
        }),
      }),
    );
  });

  it('lists with filter', async () => {
    findMany.mockResolvedValue([
      {
        id: '1',
        createdAt: new Date(),
        eventType: 'GOVERNANCE_GRAPHQL_ERROR',
        actorId: 'a',
        targetId: null,
        errorCode: 'X',
        metadata: null,
      },
    ]);

    const rows = await resolver.adminEpistemicEvents({
      errorCode: 'X',
      createdAfter: new Date(0),
    });
    expect(rows).toHaveLength(1);
  });
});
