/**
 * ADR-027 / ADR-031: importBundle must succeed against real PostgreSQL triggers.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ClaimStatus, EvidenceSourceKind, Prisma } from '@prisma/client';
import { AppModule } from '../../../src/app/app.module';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { AletheiaBundleService } from '../../../src/bundle/aletheia-bundle.service';
import { cleanDatabase, seedTestData } from '../../helpers/test-db';
import { evidenceContentSha256Hex } from '../../../src/common/utils/evidence-content-hash';

describe('Bundle import vs ADR-027 triggers (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let bundles: AletheiaBundleService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    bundles = moduleFixture.get<AletheiaBundleService>(AletheiaBundleService);
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

  it('imports DRAFT claim with no evidence', async () => {
    await seedTestData(prisma);
    const user = await prisma.user.findFirst({
      where: { email: 'test@example.com' },
    });
    if (!user) throw new Error('seed user missing');

    const claimId = '00000000-0000-4000-8000-000000000001';
    await bundles.importBundle(
      {
        version: '1',
        exportedAt: new Date().toISOString(),
        claims: [
          {
            id: claimId,
            text: 'Draft only',
            status: ClaimStatus.DRAFT,
            createdAt: new Date(),
            reviewedAt: null,
            reviewedBy: null,
            reviewerNote: null,
          } as unknown as Prisma.ClaimCreateManyInput,
        ],
        evidence: [],
        claimEvidenceLinks: [],
        adjudicationLogs: [],
        reviewRequests: [],
        reviewAssignments: [],
        reviewerResponses: [],
        evidenceReproChecks: [],
        epistemicEvents: [],
      },
      false,
    );

    const row = await prisma.claim.findUnique({ where: { id: claimId } });
    expect(row?.status).toBe(ClaimStatus.DRAFT);
  });

  it('imports REVIEWED claim after evidence and links (ordering vs triggers)', async () => {
    const { user, document, chunk } = await seedTestData(prisma);
    const snippet = 'evidence text';
    const hash = evidenceContentSha256Hex(snippet);
    const evidenceId = '00000000-0000-4000-8000-000000000011';
    const claimId = '00000000-0000-4000-8000-000000000012';

    await bundles.importBundle(
      {
        version: '1',
        exportedAt: new Date().toISOString(),
        claims: [
          {
            id: claimId,
            text: 'Needs review',
            status: ClaimStatus.REVIEWED,
            createdAt: new Date(),
            reviewedAt: new Date(),
            reviewedBy: user.id,
            reviewerNote: null,
          } as unknown as Prisma.ClaimCreateManyInput,
        ],
        evidence: [
          {
            id: evidenceId,
            createdAt: new Date(),
            createdBy: user.id,
            sourceType: EvidenceSourceKind.DOCUMENT,
            sourceDocumentId: document.id,
            chunkId: chunk.id,
            startOffset: 0,
            endOffset: 4,
            snippet,
            contentSha256: hash,
            sourceUrl: null,
            rawBodyBase64: null,
          } as unknown as Prisma.EvidenceCreateManyInput,
        ],
        claimEvidenceLinks: [
          {
            claimId,
            evidenceId,
            linkedAt: new Date(),
          } as unknown as Prisma.ClaimEvidenceLinkCreateManyInput,
        ],
        adjudicationLogs: [],
        reviewRequests: [],
        reviewAssignments: [],
        reviewerResponses: [],
        evidenceReproChecks: [],
        epistemicEvents: [],
      },
      false,
    );

    const row = await prisma.claim.findUnique({ where: { id: claimId } });
    expect(row?.status).toBe(ClaimStatus.REVIEWED);
  });

  it('imports ACCEPTED claim with adjudication log', async () => {
    const { user, document, chunk } = await seedTestData(prisma);
    const snippet = 'terminal ev';
    const hash = evidenceContentSha256Hex(snippet);
    const evidenceId = '00000000-0000-4000-8000-000000000021';
    const claimId = '00000000-0000-4000-8000-000000000022';
    const logId = '00000000-0000-4000-8000-000000000023';

    await bundles.importBundle(
      {
        version: '1',
        exportedAt: new Date().toISOString(),
        claims: [
          {
            id: claimId,
            text: 'Accepted claim',
            status: ClaimStatus.ACCEPTED,
            createdAt: new Date(),
            reviewedAt: new Date(),
            reviewedBy: user.id,
            reviewerNote: 'ok',
          } as unknown as Prisma.ClaimCreateManyInput,
        ],
        evidence: [
          {
            id: evidenceId,
            createdAt: new Date(),
            createdBy: user.id,
            sourceType: EvidenceSourceKind.DOCUMENT,
            sourceDocumentId: document.id,
            chunkId: chunk.id,
            startOffset: 0,
            endOffset: 4,
            snippet,
            contentSha256: hash,
            sourceUrl: null,
            rawBodyBase64: null,
          } as unknown as Prisma.EvidenceCreateManyInput,
        ],
        claimEvidenceLinks: [
          {
            claimId,
            evidenceId,
            linkedAt: new Date(),
          } as unknown as Prisma.ClaimEvidenceLinkCreateManyInput,
        ],
        adjudicationLogs: [
          {
            id: logId,
            claimId,
            adjudicatorId: user.id,
            decision: 'ACCEPTED',
            previousStatus: ClaimStatus.REVIEWED,
            newStatus: ClaimStatus.ACCEPTED,
            reviewerNote: 'ok',
            createdAt: new Date(),
            prevHash: null,
            entryHash: '00'.repeat(32),
          } as unknown as Prisma.AdjudicationLogCreateManyInput,
        ],
        reviewRequests: [],
        reviewAssignments: [],
        reviewerResponses: [],
        evidenceReproChecks: [],
        epistemicEvents: [],
      },
      false,
    );

    const row = await prisma.claim.findUnique({ where: { id: claimId } });
    expect(row?.status).toBe(ClaimStatus.ACCEPTED);
    const logs = await prisma.adjudicationLog.findMany({
      where: { claimId },
    });
    expect(logs.some((l) => l.newStatus === ClaimStatus.ACCEPTED)).toBe(true);
  });

  it('rejects import when claim cannot satisfy REVIEWED without evidence', async () => {
    await seedTestData(prisma);
    const claimId = '00000000-0000-4000-8000-000000000031';

    await expect(
      bundles.importBundle(
        {
          version: '1',
          exportedAt: new Date().toISOString(),
          claims: [
            {
              id: claimId,
              text: 'No evidence',
              status: ClaimStatus.REVIEWED,
              createdAt: new Date(),
              reviewedAt: null,
              reviewedBy: null,
              reviewerNote: null,
            } as unknown as Prisma.ClaimCreateManyInput,
          ],
          evidence: [],
          claimEvidenceLinks: [],
          adjudicationLogs: [],
          reviewRequests: [],
          reviewAssignments: [],
          reviewerResponses: [],
          evidenceReproChecks: [],
          epistemicEvents: [],
        },
        false,
      ),
    ).rejects.toThrow(/CLAIM_REVIEW_REQUIRES_EVIDENCE/i);
  });
});
