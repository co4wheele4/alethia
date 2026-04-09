import { logEpistemicEvent } from './logEpistemicEvent';
import { EpistemicEventType } from '@prisma/client';

describe('logEpistemicEvent', () => {
  it('creates row', async () => {
    const create = jest.fn().mockResolvedValue({});
    await logEpistemicEvent({ epistemicEvent: { create } } as any, {
      eventType: EpistemicEventType.GOVERNANCE_GRAPHQL_ERROR,
      actorId: 'a',
      targetId: null,
      errorCode: 'E',
      metadata: { k: 1 },
    });
    expect(create).toHaveBeenCalled();
  });

  it('allows null metadata', async () => {
    const create = jest.fn().mockResolvedValue({});
    await logEpistemicEvent({ epistemicEvent: { create } } as any, {
      eventType: EpistemicEventType.GOVERNANCE_GRAPHQL_ERROR,
      actorId: null,
      targetId: null,
      errorCode: 'E',
      metadata: null,
    });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ metadata: undefined }),
      }),
    );
  });
});
