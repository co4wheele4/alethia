import { Prisma } from '@prisma/client';

/**
 * ADR-035: Predicate for claims visible in a user's workspace — anchored to their documents/evidence
 * or created by them (draft claims without linked evidence yet).
 */
export function claimWorkspaceOr(
  userId: string,
): NonNullable<Prisma.ClaimWhereInput['OR']> {
  return [
    { createdByUserId: userId },
    {
      evidenceLinks: {
        some: {
          evidence: {
            sourceDocument: { userId },
          },
        },
      },
    },
    {
      evidence: {
        some: { document: { userId } },
      },
    },
  ];
}
