/**
 * Integration checks for aletheia-backend/scripts/seed/test-seed.lib.ts against aletheia_test.
 * Run via: npm run test:e2e (requires DATABASE_URL / postgres, see docs/dev/test-seed.md).
 */
import { ClaimStatus, PrismaClient, ReviewerResponseType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

import {
  assertSeedIntegrity,
  IDS,
  runTestSeed,
} from '../../aletheia-backend/scripts/seed/test-seed.lib';

describe('deterministic test seed integrity', () => {
  let prisma: PrismaClient;
  let pool: Pool;

  beforeAll(async () => {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error('DATABASE_URL is required (see test/e2e/helpers/setup-e2e.ts).');
    }
    const dbName = url.match(/\/([^/?]+)(\?|$)/)?.[1];
    if (dbName !== 'aletheia_test') {
      throw new Error(
        `Refusing to run seed integrity tests against "${dbName}". Expected aletheia_test.`,
      );
    }
    pool = new Pool({ connectionString: url });
    prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
    await runTestSeed(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

  it('enforces ADR-018 closure and evidence anchor checks', async () => {
    await assertSeedIntegrity(prisma);
  });

  it('stores only adjudication-shaped lifecycle transitions in adjudication_logs', async () => {
    const logs = await prisma.adjudicationLog.findMany({
      select: { decision: true, newStatus: true, previousStatus: true },
    });
    expect(logs.length).toBeGreaterThanOrEqual(6);
    for (const row of logs) {
      expect(['REVIEW', 'ACCEPTED', 'REJECTED']).toContain(row.decision);
      if (row.decision === 'REVIEW') {
        expect(row.newStatus).toBe(ClaimStatus.REVIEWED);
      } else if (row.decision === 'ACCEPTED') {
        expect(row.newStatus).toBe(ClaimStatus.ACCEPTED);
      } else if (row.decision === 'REJECTED') {
        expect(row.newStatus).toBe(ClaimStatus.REJECTED);
      }
    }
  });

  it('does not tie review coordination rows to adjudication logs (separate artifacts)', async () => {
    const rr = await prisma.reviewRequest.count();
    const al = await prisma.adjudicationLog.count();
    expect(rr).toBeGreaterThanOrEqual(5);
    expect(al).toBeGreaterThanOrEqual(6);
    const sample = await prisma.reviewRequest.findFirst({
      where: { id: IDS.reviewRequests.rr1 },
      include: { claim: { select: { status: true } } },
    });
    expect(sample?.claim.status).toBe(ClaimStatus.REVIEWED);
  });

  it('materializes multi-reviewer and decline coordination scenarios', async () => {
    const multi = await prisma.reviewAssignment.count({
      where: { reviewRequestId: IDS.reviewRequests.rr2 },
    });
    expect(multi).toBe(2);

    const declined = await prisma.reviewerResponse.findFirst({
      where: {
        response: ReviewerResponseType.DECLINED,
        reviewAssignmentId: IDS.assignments.a6,
      },
    });
    expect(declined).toBeTruthy();
  });
});
