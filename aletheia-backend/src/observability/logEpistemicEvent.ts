import { EpistemicEventType, Prisma } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';

export type LogEpistemicEventArgs = {
  eventType: EpistemicEventType;
  actorId: string | null;
  targetId: string | null;
  errorCode: string;
  metadata?: Record<string, unknown> | null;
};

/**
 * ADR-029: Append-only audit record; does not affect adjudication or claim state.
 */
export async function logEpistemicEvent(
  prisma: PrismaService,
  args: LogEpistemicEventArgs,
): Promise<void> {
  await prisma.epistemicEvent.create({
    data: {
      eventType: args.eventType,
      actorId: args.actorId,
      targetId: args.targetId,
      errorCode: args.errorCode,
      metadata:
        args.metadata === undefined || args.metadata === null
          ? undefined
          : (args.metadata as Prisma.InputJsonValue),
    },
  });
}
