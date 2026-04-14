import { PrismaService } from '@prisma/prisma.service';
import { adjudicationEntryHashHex } from '../common/integrity/adjudication-entry-hash';
import { IntegrityService } from './integrity.service';

describe('IntegrityService (ADR-036)', () => {
  const t0 = new Date('2026-01-01T00:00:00.000Z');
  const t1 = new Date('2026-01-02T00:00:00.000Z');

  it('counts missing adjudication hashes and skips chain checks for those rows', async () => {
    const adjudicationLogFindMany = jest.fn().mockResolvedValue([
      {
        id: '1',
        claimId: 'c1',
        adjudicatorId: 'u1',
        decision: 'REVIEW',
        createdAt: t0,
        prevHash: null,
        entryHash: null,
      },
    ]);
    const evidenceCount = jest.fn().mockResolvedValue(2);
    const prisma = {
      adjudicationLog: { findMany: adjudicationLogFindMany },
      evidence: { count: evidenceCount },
    } as unknown as PrismaService;

    const svc = new IntegrityService(prisma);
    const r = await svc.validateAdjudicationChain();
    expect(r.adjudicationMissingHashCount).toBe(1);
    expect(r.adjudicationBrokenChainCount).toBe(0);
    expect(r.adjudicationHashMismatchCount).toBe(0);
    expect(r.evidenceMissingContentHashCount).toBe(2);
  });

  it('detects broken chain when prevHash does not match prior entryHash', async () => {
    const h1 = adjudicationEntryHashHex({
      prevHash: null,
      claimId: 'c1',
      adjudicatorId: 'u1',
      decision: 'REVIEW',
      createdAt: t0,
    });
    const wrongPrev = 'not-the-previous-hash';
    const h2 = adjudicationEntryHashHex({
      prevHash: wrongPrev,
      claimId: 'c1',
      adjudicatorId: 'u1',
      decision: 'ACCEPTED',
      createdAt: t1,
    });

    const adjudicationLogFindMany = jest.fn().mockResolvedValue([
      {
        id: '1',
        claimId: 'c1',
        adjudicatorId: 'u1',
        decision: 'REVIEW',
        createdAt: t0,
        prevHash: null,
        entryHash: h1,
      },
      {
        id: '2',
        claimId: 'c1',
        adjudicatorId: 'u1',
        decision: 'ACCEPTED',
        createdAt: t1,
        prevHash: wrongPrev,
        entryHash: h2,
      },
    ]);
    const evidenceCount = jest.fn().mockResolvedValue(0);
    const prisma = {
      adjudicationLog: { findMany: adjudicationLogFindMany },
      evidence: { count: evidenceCount },
    } as unknown as PrismaService;

    const svc = new IntegrityService(prisma);
    const r = await svc.validateAdjudicationChain();
    expect(r.adjudicationBrokenChainCount).toBe(1);
    expect(r.adjudicationHashMismatchCount).toBe(0);
  });

  it('detects hash mismatch when entryHash does not match canonical payload', async () => {
    const h1 = adjudicationEntryHashHex({
      prevHash: null,
      claimId: 'c1',
      adjudicatorId: 'u1',
      decision: 'REVIEW',
      createdAt: t0,
    });

    const adjudicationLogFindMany = jest.fn().mockResolvedValue([
      {
        id: '1',
        claimId: 'c1',
        adjudicatorId: 'u1',
        decision: 'REVIEW',
        createdAt: t0,
        prevHash: null,
        entryHash: h1,
      },
      {
        id: '2',
        claimId: 'c1',
        adjudicatorId: 'u1',
        decision: 'ACCEPTED',
        createdAt: t1,
        prevHash: h1,
        entryHash: 'not-a-valid-digest',
      },
    ]);
    const evidenceCount = jest.fn().mockResolvedValue(0);
    const prisma = {
      adjudicationLog: { findMany: adjudicationLogFindMany },
      evidence: { count: evidenceCount },
    } as unknown as PrismaService;

    const svc = new IntegrityService(prisma);
    const r = await svc.validateAdjudicationChain();
    expect(r.adjudicationBrokenChainCount).toBe(0);
    expect(r.adjudicationHashMismatchCount).toBe(1);
  });

  it('accepts a valid two-row chain', async () => {
    const h1 = adjudicationEntryHashHex({
      prevHash: null,
      claimId: 'c1',
      adjudicatorId: 'u1',
      decision: 'REVIEW',
      createdAt: t0,
    });
    const h2 = adjudicationEntryHashHex({
      prevHash: h1,
      claimId: 'c2',
      adjudicatorId: 'u2',
      decision: 'ACCEPTED',
      createdAt: t1,
    });

    const adjudicationLogFindMany = jest.fn().mockResolvedValue([
      {
        id: '1',
        claimId: 'c1',
        adjudicatorId: 'u1',
        decision: 'REVIEW',
        createdAt: t0,
        prevHash: null,
        entryHash: h1,
      },
      {
        id: '2',
        claimId: 'c2',
        adjudicatorId: 'u2',
        decision: 'ACCEPTED',
        createdAt: t1,
        prevHash: h1,
        entryHash: h2,
      },
    ]);
    const evidenceCount = jest.fn().mockResolvedValue(0);
    const prisma = {
      adjudicationLog: { findMany: adjudicationLogFindMany },
      evidence: { count: evidenceCount },
    } as unknown as PrismaService;

    const svc = new IntegrityService(prisma);
    const r = await svc.validateAdjudicationChain();
    expect(r.adjudicationBrokenChainCount).toBe(0);
    expect(r.adjudicationHashMismatchCount).toBe(0);
  });
});
