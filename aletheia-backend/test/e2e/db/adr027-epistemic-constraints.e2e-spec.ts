// ADR-027: PostgreSQL triggers enforce epistemic invariants.
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ClaimStatus, EvidenceSourceKind } from '@prisma/client';
import { AppModule } from '../../../src/app/app.module';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { cleanDatabase, seedTestData } from '../../helpers/test-db';
import { evidenceContentSha256Hex } from '../../../src/common/utils/evidence-content-hash';

describe('ADR-027 epistemic DB constraints (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    await cleanDatabase(prisma);
    await prisma.$disconnect();
    await app.close();
  });

  beforeEach(async () => {
    await cleanDatabase(prisma);
  });

  it('rejects UPDATE on evidence (immutability)', async () => {
    const { user, document, chunk } = await seedTestData(prisma);
    const ev = await prisma.evidence.create({
      data: {
        createdBy: user.id,
        sourceType: EvidenceSourceKind.DOCUMENT,
        sourceDocumentId: document.id,
        chunkId: chunk.id,
        startOffset: 0,
        endOffset: 4,
        snippet: 'Test',
        contentSha256: evidenceContentSha256Hex('Test'),
      },
    });

    await expect(
      prisma.evidence.update({
        where: { id: ev.id },
        data: { snippet: 'changed' },
      }),
    ).rejects.toThrow(/EVIDENCE_IMMUTABLE/i);
  });

  it('rejects setting claim to REVIEWED without evidence', async () => {
    await seedTestData(prisma);
    const claim = await prisma.claim.create({
      data: { text: 'c', status: ClaimStatus.DRAFT },
    });

    await expect(
      prisma.claim.update({
        where: { id: claim.id },
        data: { status: ClaimStatus.REVIEWED },
      }),
    ).rejects.toThrow(/CLAIM_REVIEW_REQUIRES_EVIDENCE/i);
  });

  it('rejects ACCEPTED without adjudication log', async () => {
    const { user, document, chunk } = await seedTestData(prisma);
    const claim = await prisma.claim.create({
      data: { text: 'c', status: ClaimStatus.DRAFT },
    });
    const ev = await prisma.evidence.create({
      data: {
        createdBy: user.id,
        sourceType: EvidenceSourceKind.DOCUMENT,
        sourceDocumentId: document.id,
        chunkId: chunk.id,
        startOffset: 0,
        endOffset: 4,
        snippet: 'Test',
        contentSha256: evidenceContentSha256Hex('Test'),
      },
    });
    await prisma.claimEvidenceLink.create({
      data: { claimId: claim.id, evidenceId: ev.id },
    });
    await prisma.claim.update({
      where: { id: claim.id },
      data: { status: ClaimStatus.REVIEWED },
    });

    await expect(
      prisma.claim.update({
        where: { id: claim.id },
        data: { status: ClaimStatus.ACCEPTED },
      }),
    ).rejects.toThrow(/CLAIM_TERMINAL_REQUIRES_ADJUDICATION_LOG/i);
  });

  it('rejects REJECTED without adjudication log', async () => {
    const { user, document, chunk } = await seedTestData(prisma);
    const claim = await prisma.claim.create({
      data: { text: 'c', status: ClaimStatus.DRAFT },
    });
    const ev = await prisma.evidence.create({
      data: {
        createdBy: user.id,
        sourceType: EvidenceSourceKind.DOCUMENT,
        sourceDocumentId: document.id,
        chunkId: chunk.id,
        startOffset: 0,
        endOffset: 4,
        snippet: 'Test',
        contentSha256: evidenceContentSha256Hex('Test'),
      },
    });
    await prisma.claimEvidenceLink.create({
      data: { claimId: claim.id, evidenceId: ev.id },
    });
    await prisma.claim.update({
      where: { id: claim.id },
      data: { status: ClaimStatus.REVIEWED },
    });

    await expect(
      prisma.claim.update({
        where: { id: claim.id },
        data: { status: ClaimStatus.REJECTED },
      }),
    ).rejects.toThrow(/CLAIM_TERMINAL_REQUIRES_ADJUDICATION_LOG/i);
  });

  it('allows terminal status when adjudication log exists (same transaction pattern)', async () => {
    const { user, document, chunk } = await seedTestData(prisma);
    const claim = await prisma.claim.create({
      data: { text: 'c', status: ClaimStatus.DRAFT },
    });
    const ev = await prisma.evidence.create({
      data: {
        createdBy: user.id,
        sourceType: EvidenceSourceKind.DOCUMENT,
        sourceDocumentId: document.id,
        chunkId: chunk.id,
        startOffset: 0,
        endOffset: 4,
        snippet: 'Test',
        contentSha256: evidenceContentSha256Hex('Test'),
      },
    });
    await prisma.claimEvidenceLink.create({
      data: { claimId: claim.id, evidenceId: ev.id },
    });
    await prisma.claim.update({
      where: { id: claim.id },
      data: { status: ClaimStatus.REVIEWED },
    });

    await prisma.$transaction(async (tx) => {
      await tx.adjudicationLog.create({
        data: {
          claimId: claim.id,
          adjudicatorId: user.id,
          decision: 'ACCEPTED',
          previousStatus: ClaimStatus.REVIEWED,
          newStatus: ClaimStatus.ACCEPTED,
        },
      });
      await tx.claim.update({
        where: { id: claim.id },
        data: { status: ClaimStatus.ACCEPTED },
      });
    });

    const updated = await prisma.claim.findUnique({ where: { id: claim.id } });
    expect(updated?.status).toBe(ClaimStatus.ACCEPTED);
  });
});
