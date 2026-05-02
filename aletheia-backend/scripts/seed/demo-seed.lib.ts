/**
 * Deterministic demo seed for investor walkthroughs.
 *
 * Goals:
 * - Simple, narratable dataset that demonstrates Aletheia's core mechanics:
 *   - provenance (DocumentSource)
 *   - chunking (DocumentChunk)
 *   - reusable evidence anchors (Evidence + ClaimEvidenceLink)
 *   - coordination-only review workflow (ReviewRequest / ReviewAssignment / ReviewerResponse)
 *   - entity graph primitives (Entity / EntityMention / EntityRelationship + evidence anchors)
 *   - audit-only crawl evidence (HtmlCrawlIngestionRun + HTML_PAGE Evidence)
 *
 * Non-goals:
 * - No confidence / ranking / comparative semantics.
 * - No interpretive agent outputs.
 */
import { createHash } from 'crypto';
import bcrypt from 'bcrypt';
import {
  DocumentSourceKind,
  EvidenceSourceKind,
  HtmlCrawlFetchStatus,
  HtmlCrawlFollowMode,
  HtmlCrawlRunStatus,
  RelationshipEvidenceKind,
  ReviewerResponseType,
  ReviewRequestSource,
} from '@prisma/client';
import type { PrismaClient } from '@prisma/client';

export const DEMO_IDS = {
  users: {
    admin: 'd0000000-0000-4000-8000-000000000001',
    founder: 'd0000000-0000-4000-8000-000000000002',
    reviewer: 'd0000000-0000-4000-8000-000000000003',
  },
  lessons: {
    intro: 'd1000000-0000-4000-8000-000000000001',
  },
  documents: {
    press: 'd2000000-0000-4000-8000-000000000001',
    filing: 'd2000000-0000-4000-8000-000000000002',
    crawlSnapshot: 'd2000000-0000-4000-8000-000000000003',
  },
  entities: {
    aletheia: 'd3000000-0000-4000-8000-000000000001',
    acme: 'd3000000-0000-4000-8000-000000000002',
    fda: 'd3000000-0000-4000-8000-000000000003',
    trialX: 'd3000000-0000-4000-8000-000000000004',
  },
  relationships: {
    acmeRunsTrial: 'd4000000-0000-4000-8000-000000000001',
  },
  claims: {
    primary: 'd5000000-0000-4000-8000-000000000001',
    secondary: 'd5000000-0000-4000-8000-000000000002',
  },
  review: {
    request: 'd6000000-0000-4000-8000-000000000001',
    assignment: 'd6000000-0000-4000-8000-000000000002',
    response: 'd6000000-0000-4000-8000-000000000003',
  },
  crawl: {
    run: 'd7000000-0000-4000-8000-000000000001',
    link1: 'd7000000-0000-4000-8000-000000000002',
  },
  evidence: {
    // Document evidence anchors (snippets)
    pressSnippet: 'd8000000-0000-4000-8000-000000000001',
    filingSnippet: 'd8000000-0000-4000-8000-000000000002',
    // Crawl evidence anchor (raw HTML)
    crawlHtml: 'd8000000-0000-4000-8000-000000000003',
  },
  epistemicEvents: {
    governanceError: 'd9000000-0000-4000-8000-000000000001',
  },
} as const;

function sha256HexUtf8(s: string): string {
  return createHash('sha256').update(s, 'utf8').digest('hex');
}

function fixedTime(minutesFromStart: number): Date {
  // Deterministic timestamps help repeatable demos.
  const base = new Date('2026-04-30T18:00:00.000Z');
  return new Date(base.getTime() + minutesFromStart * 60_000);
}

function findSpanOffsets(haystack: string, needle: string): { start: number; end: number } {
  const start = haystack.indexOf(needle);
  if (start < 0) throw new Error(`Span not found: "${needle}"`);
  return { start, end: start + needle.length };
}

function firstChunkContainingNeedle(
  chunks: { id: string; content: string; chunkIndex: number }[],
  needles: string[],
): { chunk: (typeof chunks)[number]; needle: string } {
  for (const needle of needles) {
    const chunk = chunks.find((c) => c.content.includes(needle));
    if (chunk) return { chunk, needle };
  }
  throw new Error(`No chunk matched any of: ${needles.join(' | ')}`);
}

export async function runDemoSeed(prisma: PrismaClient): Promise<{
  counts: Record<string, number>;
}> {
  const counts: Record<string, number> = {};

  // ----- Users -----
  const passwordHash = await bcrypt.hash('password123', 10);
  // Use upserts (not createMany+skipDuplicates): demo DBs often already have seed-admin with a different UUID,
  // which would skip the insert but still leave FK references pointing at a non-existent id.
  await prisma.user.upsert({
    where: { email: 'seed-admin@aletheia.test' },
    create: {
      id: DEMO_IDS.users.admin,
      email: 'seed-admin@aletheia.test',
      name: 'Seed Admin (Demo)',
      role: 'ADMIN',
      passwordHash,
      createdAt: fixedTime(0),
    },
    update: {
      name: 'Seed Admin (Demo)',
      role: 'ADMIN',
      passwordHash,
    },
  });
  await prisma.user.upsert({
    where: { email: 'demo-founder@aletheia.test' },
    create: {
      id: DEMO_IDS.users.founder,
      email: 'demo-founder@aletheia.test',
      name: 'Demo Founder',
      role: 'USER',
      passwordHash,
      createdAt: fixedTime(1),
    },
    update: {
      name: 'Demo Founder',
      role: 'USER',
      passwordHash,
    },
  });
  await prisma.user.upsert({
    where: { email: 'demo-reviewer@aletheia.test' },
    create: {
      id: DEMO_IDS.users.reviewer,
      email: 'demo-reviewer@aletheia.test',
      name: 'Demo Reviewer',
      role: 'USER',
      passwordHash,
      createdAt: fixedTime(2),
    },
    update: {
      name: 'Demo Reviewer',
      role: 'USER',
      passwordHash,
    },
  });
  counts.users = 3;

  const adminUser = await prisma.user.findUniqueOrThrow({
    where: { email: 'seed-admin@aletheia.test' },
    select: { id: true },
  });
  const founderUser = await prisma.user.findUniqueOrThrow({
    where: { email: 'demo-founder@aletheia.test' },
    select: { id: true },
  });
  const reviewerUser = await prisma.user.findUniqueOrThrow({
    where: { email: 'demo-reviewer@aletheia.test' },
    select: { id: true },
  });
  const adminId = adminUser.id;
  const founderId = founderUser.id;
  const reviewerId = reviewerUser.id;

  // ----- Lesson (simple onboarding artifact) -----
  await prisma.lesson.createMany({
    data: [
      {
        id: DEMO_IDS.lessons.intro,
        userId: founderId,
        title: 'Aletheia in 5 minutes',
        content:
          'This walkthrough shows how claims stay grounded in inspectable evidence, without confidence scores.\n\nYou will:\n- ingest sources\n- link evidence to claims\n- coordinate review\n- inspect entity mentions and relationships with offsets.',
        createdAt: fixedTime(3),
      },
    ],
    skipDuplicates: true,
  });
  counts.lessons = 1;

  // ----- Documents + Sources + Chunks -----
  const pressText =
    'ACME Bio announced a Phase 2 trial of Trial X on 2026-04-15.\n\n' +
    'The company stated the trial is overseen by the FDA.\n\n' +
    'This is a demo source snapshot for walkthrough purposes.';

  const filingText =
    'Form 10-Q excerpt:\n\n' +
    'ACME Bio reported cash on hand of $12.3M as of 2026-03-31.\n\n' +
    'The filing states that Trial X enrollment began in Q1 2026.\n\n' +
    'This is a demo source snapshot for walkthrough purposes.';

  const crawlHtml =
    '<html><head><title>Example Health News</title></head><body>' +
    '<h1>Example Health News</h1>' +
    '<p>ACME Bio announced Trial X results were published.</p>' +
    '<a href="https://example.com/next">Next</a>' +
    '</body></html>';

  const pressContentSha = sha256HexUtf8(pressText);
  const filingContentSha = sha256HexUtf8(filingText);
  const crawlText = 'Example Health News\n\nACME Bio announced Trial X results were published.\n\nNext';
  const crawlTextSha = sha256HexUtf8(crawlText);

  // Create documents (idempotent by explicit IDs + skipDuplicates patterns).
  await prisma.document.createMany({
    data: [
      {
        id: DEMO_IDS.documents.press,
        userId: founderId,
        title: 'ACME press release snapshot',
        sourceType: DocumentSourceKind.URL,
        sourceLabel: 'https://example.com/press/acme-phase2',
        createdAt: fixedTime(4),
      },
      {
        id: DEMO_IDS.documents.filing,
        userId: founderId,
        title: 'ACME 10-Q excerpt snapshot',
        sourceType: DocumentSourceKind.FILE,
        sourceLabel: 'acme-10q-excerpt.txt',
        createdAt: fixedTime(5),
      },
      {
        id: DEMO_IDS.documents.crawlSnapshot,
        userId: founderId,
        title: 'Example Health News (crawl snapshot)',
        sourceType: DocumentSourceKind.URL,
        sourceLabel: 'https://example.com/',
        createdAt: fixedTime(6),
      },
    ],
    skipDuplicates: true,
  });
  counts.documents = 3;

  await prisma.documentSource.createMany({
    data: [
      {
        documentId: DEMO_IDS.documents.press,
        kind: DocumentSourceKind.URL,
        ingestedAt: fixedTime(4),
        contentSha256: pressContentSha,
        requestedUrl: 'https://example.com/press/acme-phase2',
        fetchedUrl: 'https://example.com/press/acme-phase2',
        contentType: 'text/plain; charset=utf-8',
        publisher: 'ACME Bio',
        author: 'Comms Desk',
        publishedAt: fixedTime(-15),
        accessedAt: fixedTime(4),
      },
      {
        documentId: DEMO_IDS.documents.filing,
        kind: DocumentSourceKind.FILE,
        ingestedAt: fixedTime(5),
        contentSha256: filingContentSha,
        filename: 'acme-10q-excerpt.txt',
        mimeType: 'text/plain',
        sizeBytes: filingText.length,
        lastModifiedMs: BigInt(fixedTime(0).getTime()),
      },
      {
        documentId: DEMO_IDS.documents.crawlSnapshot,
        kind: DocumentSourceKind.URL,
        ingestedAt: fixedTime(6),
        contentSha256: crawlTextSha,
        requestedUrl: 'https://example.com/',
        fetchedUrl: 'https://example.com/',
        contentType: 'text/html; charset=utf-8',
        publisher: 'Example Health News',
        accessedAt: fixedTime(6),
      },
    ],
    skipDuplicates: true,
  });
  counts.documentSources = 3;

  const pressParas = pressText.split(/\n\s*\n/);
  const filingParas = filingText.split(/\n\s*\n/);
  const crawlParas = crawlText.split(/\n\s*\n/);

  await prisma.documentChunk.createMany({
    data: [
      ...pressParas.map((p, idx) => ({
        documentId: DEMO_IDS.documents.press,
        chunkIndex: idx,
        content: p.trim(),
      })),
      ...filingParas.map((p, idx) => ({
        documentId: DEMO_IDS.documents.filing,
        chunkIndex: idx,
        content: p.trim(),
      })),
      ...crawlParas.map((p, idx) => ({
        documentId: DEMO_IDS.documents.crawlSnapshot,
        chunkIndex: idx,
        content: p.trim(),
      })),
    ],
    skipDuplicates: true,
  });
  counts.documentChunks = pressParas.length + filingParas.length + crawlParas.length;

  // Fetch chunk IDs for offsets / evidence anchoring.
  const [pressChunks, filingChunks] = await Promise.all([
    prisma.documentChunk.findMany({
      where: { documentId: DEMO_IDS.documents.press },
      orderBy: { chunkIndex: 'asc' },
      select: { id: true, content: true, chunkIndex: true },
    }),
    prisma.documentChunk.findMany({
      where: { documentId: DEMO_IDS.documents.filing },
      orderBy: { chunkIndex: 'asc' },
      select: { id: true, content: true, chunkIndex: true },
    }),
  ]);

  const pressChunk0 = pressChunks.find((c) => c.chunkIndex === 0);
  if (!pressChunk0) {
    throw new Error('Expected demo press chunk missing (seed integrity).');
  }

  const { chunk: filingChunkForSnippet, needle: filingSnippetText } = firstChunkContainingNeedle(
    filingChunks,
    [
      'Trial X enrollment began in Q1 2026',
      'Trial X enrollment began',
      'enrollment began in Q1 2026',
    ],
  );

  // ----- Entities + Mentions + Relationship -----
  await prisma.entity.createMany({
    data: [
      { id: DEMO_IDS.entities.aletheia, name: 'Aletheia', type: 'PRODUCT' },
      { id: DEMO_IDS.entities.acme, name: 'ACME Bio', type: 'ORG' },
      { id: DEMO_IDS.entities.fda, name: 'FDA', type: 'ORG' },
      { id: DEMO_IDS.entities.trialX, name: 'Trial X', type: 'TRIAL' },
    ],
    skipDuplicates: true,
  });
  counts.entities = 4;

  const pressOffsetsAcme = findSpanOffsets(pressChunk0.content, 'ACME Bio');
  const pressOffsetsTrial = findSpanOffsets(pressChunk0.content, 'Trial X');

  const fdaChunk = pressChunks.find((c) => /FDA/.test(c.content));
  if (!fdaChunk) throw new Error('Expected FDA paragraph chunk missing.');
  const fdaOffsets = findSpanOffsets(fdaChunk.content, 'FDA');

  await prisma.entityMention.createMany({
    data: [
      {
        entityId: DEMO_IDS.entities.acme,
        chunkId: pressChunk0.id,
        startOffset: pressOffsetsAcme.start,
        endOffset: pressOffsetsAcme.end,
        excerpt: 'ACME Bio',
      },
      {
        entityId: DEMO_IDS.entities.trialX,
        chunkId: pressChunk0.id,
        startOffset: pressOffsetsTrial.start,
        endOffset: pressOffsetsTrial.end,
        excerpt: 'Trial X',
      },
      {
        entityId: DEMO_IDS.entities.fda,
        chunkId: fdaChunk.id,
        startOffset: fdaOffsets.start,
        endOffset: fdaOffsets.end,
        excerpt: 'FDA',
      },
    ],
    skipDuplicates: true,
  });
  counts.entityMentions = 3;

  // Relationship: ACME Bio runs Trial X (with explicit evidence anchor inside a chunk).
  const relationship = await prisma.entityRelationship.upsert({
    where: { id: DEMO_IDS.relationships.acmeRunsTrial },
    update: {},
    create: {
      id: DEMO_IDS.relationships.acmeRunsTrial,
      fromEntity: DEMO_IDS.entities.acme,
      toEntity: DEMO_IDS.entities.trialX,
      relation: 'RUNS_TRIAL',
    },
    select: { id: true },
  });

  // Relationship evidence (quote offsets within press chunk 0).
  const quotedText = 'announced a Phase 2 trial of Trial X';
  const relOffsets = findSpanOffsets(pressChunk0.content, quotedText);
  const relEvidence = await prisma.entityRelationshipEvidence.upsert({
    where: { id: 'd4100000-0000-4000-8000-000000000001' },
    update: {},
    create: {
      id: 'd4100000-0000-4000-8000-000000000001',
      relationshipId: relationship.id,
      chunkId: pressChunk0.id,
      kind: RelationshipEvidenceKind.TEXT_SPAN,
      startOffset: relOffsets.start,
      endOffset: relOffsets.end,
      quotedText,
      createdAt: fixedTime(7),
    },
    select: { id: true },
  });

  // Mention links (explicit, persisted).
  const mentionsInChunk0 = await prisma.entityMention.findMany({
    where: { chunkId: pressChunk0.id },
    select: { id: true, entityId: true },
  });
  const mentionAcme = mentionsInChunk0.find((m) => m.entityId === DEMO_IDS.entities.acme);
  const mentionTrial = mentionsInChunk0.find((m) => m.entityId === DEMO_IDS.entities.trialX);
  if (mentionAcme) {
    await prisma.entityRelationshipEvidenceMention.createMany({
      data: [{ evidenceId: relEvidence.id, mentionId: mentionAcme.id }],
      skipDuplicates: true,
    });
  }
  if (mentionTrial) {
    await prisma.entityRelationshipEvidenceMention.createMany({
      data: [{ evidenceId: relEvidence.id, mentionId: mentionTrial.id }],
      skipDuplicates: true,
    });
  }
  counts.relationships = 1;

  // ----- Evidence anchors (ADR-019) -----
  const pressSnippet = 'ACME Bio announced a Phase 2 trial of Trial X';
  const pressSnippetOffsets = findSpanOffsets(pressChunk0.content, pressSnippet);
  const pressSnippetSha = sha256HexUtf8(pressSnippet);

  const filingSnippetOffsets = findSpanOffsets(filingChunkForSnippet.content, filingSnippetText);
  const filingSnippetSha = sha256HexUtf8(filingSnippetText);

  await prisma.evidence.createMany({
    data: [
      {
        id: DEMO_IDS.evidence.pressSnippet,
        createdAt: fixedTime(8),
        createdBy: founderId,
        sourceType: EvidenceSourceKind.DOCUMENT,
        sourceDocumentId: DEMO_IDS.documents.press,
        sourceUrl: 'https://example.com/press/acme-phase2',
        chunkId: pressChunk0.id,
        startOffset: pressSnippetOffsets.start,
        endOffset: pressSnippetOffsets.end,
        snippet: pressSnippet,
        contentSha256: pressSnippetSha,
      },
      {
        id: DEMO_IDS.evidence.filingSnippet,
        createdAt: fixedTime(9),
        createdBy: founderId,
        sourceType: EvidenceSourceKind.DOCUMENT,
        sourceDocumentId: DEMO_IDS.documents.filing,
        sourceUrl: null,
        chunkId: filingChunkForSnippet.id,
        startOffset: filingSnippetOffsets.start,
        endOffset: filingSnippetOffsets.end,
        snippet: filingSnippetText,
        contentSha256: filingSnippetSha,
      },
      {
        id: DEMO_IDS.evidence.crawlHtml,
        createdAt: fixedTime(10),
        createdBy: founderId,
        sourceType: EvidenceSourceKind.HTML_PAGE,
        sourceDocumentId: null,
        sourceUrl: 'https://example.com/',
        chunkId: null,
        startOffset: null,
        endOffset: null,
        snippet: null,
        contentSha256: sha256HexUtf8(crawlHtml),
        rawBody: new Uint8Array(Buffer.from(crawlHtml, 'utf8')),
      },
    ],
    skipDuplicates: true,
  });
  counts.evidence = 3;

  // ----- Claims + claim-evidence links -----
  await prisma.claim.createMany({
    data: [
      {
        id: DEMO_IDS.claims.primary,
        text: 'ACME Bio announced a Phase 2 trial of Trial X on 2026-04-15.',
        status: 'DRAFT',
        createdAt: fixedTime(11),
        createdByUserId: founderId,
      },
      {
        id: DEMO_IDS.claims.secondary,
        text: 'Trial X enrollment began in Q1 2026.',
        status: 'DRAFT',
        createdAt: fixedTime(12),
        createdByUserId: founderId,
      },
    ],
    skipDuplicates: true,
  });
  counts.claims = 2;

  await prisma.claimEvidenceLink.createMany({
    data: [
      { claimId: DEMO_IDS.claims.primary, evidenceId: DEMO_IDS.evidence.pressSnippet, linkedAt: fixedTime(13) },
      { claimId: DEMO_IDS.claims.secondary, evidenceId: DEMO_IDS.evidence.filingSnippet, linkedAt: fixedTime(14) },
    ],
    skipDuplicates: true,
  });
  counts.claimEvidenceLinks = 2;

  // ----- Review coordination (ADR-015/016) -----
  await prisma.reviewRequest.createMany({
    data: [
      {
        id: DEMO_IDS.review.request,
        claimId: DEMO_IDS.claims.primary,
        requestedByUserId: founderId,
        requestedAt: fixedTime(15),
        source: ReviewRequestSource.CLAIM_VIEW,
        note: 'Please verify the date and that this is truly Phase 2 (coordination only).',
      },
    ],
    skipDuplicates: true,
  });
  await prisma.reviewAssignment.createMany({
    data: [
      {
        id: DEMO_IDS.review.assignment,
        reviewRequestId: DEMO_IDS.review.request,
        reviewerUserId: reviewerId,
        assignedByUserId: adminId,
        assignedAt: fixedTime(16),
      },
    ],
    skipDuplicates: true,
  });
  await prisma.reviewerResponse.createMany({
    data: [
      {
        id: DEMO_IDS.review.response,
        reviewAssignmentId: DEMO_IDS.review.assignment,
        reviewerUserId: reviewerId,
        response: ReviewerResponseType.ACKNOWLEDGED,
        respondedAt: fixedTime(17),
        note: 'Acknowledged. I will inspect the evidence anchor text + offsets.',
      },
    ],
    skipDuplicates: true,
  });
  counts.reviewRequests = 1;
  counts.reviewAssignments = 1;
  counts.reviewerResponses = 1;

  // ----- HTML crawl audit record (ADR-032) -----
  await prisma.htmlCrawlIngestionRun.createMany({
    data: [
      {
        id: DEMO_IDS.crawl.run,
        createdByUserId: founderId,
        seedUrl: 'https://example.com/',
        crawlDepth: 1,
        maxPages: 2,
        allowedDomains: ['example.com'],
        includeQueryParams: false,
        followMode: HtmlCrawlFollowMode.STRICT_ONLY,
        startedAt: fixedTime(18),
        finishedAt: fixedTime(19),
        status: HtmlCrawlRunStatus.SUCCESS,
        errorLog: null,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.htmlCrawlIngestionRunEvidence.createMany({
    data: [
      {
        id: DEMO_IDS.crawl.link1,
        runId: DEMO_IDS.crawl.run,
        evidenceId: DEMO_IDS.evidence.crawlHtml,
        url: 'https://example.com/',
        depth: 0,
        fetchStatus: HtmlCrawlFetchStatus.SUCCESS,
        errorMessage: null,
      },
    ],
    skipDuplicates: true,
  });
  counts.htmlCrawlRuns = 1;
  counts.htmlCrawlRunEvidence = 1;

  // ----- Epistemic event (audit only) -----
  await prisma.epistemicEvent.createMany({
    data: [
      {
        id: DEMO_IDS.epistemicEvents.governanceError,
        createdAt: fixedTime(20),
        eventType: 'GOVERNANCE_GRAPHQL_ERROR',
        actorId: founderId,
        targetId: null,
        errorCode: 'DERIVED_SEMANTICS_FORBIDDEN',
        metadata: { operationName: 'DemoBadQuery', note: 'For demos: shows policy guardrails' },
      },
    ],
    skipDuplicates: true,
  });
  counts.epistemicEvents = 1;

  // AI suggestions (optional demo: proposals, not truth)
  const suggestionExcerpt = 'ACME Bio announced a Phase 2 trial of Trial X';
  await prisma.aiExtractionSuggestion.createMany({
    data: [
      {
        chunkId: pressChunk0.id,
        kind: 'ENTITY_MENTION',
        status: 'PENDING',
        entityName: 'ACME Bio',
        entityType: 'ORG',
        startOffset: pressOffsetsAcme.start,
        endOffset: pressOffsetsAcme.end,
        excerpt: 'ACME Bio',
        createdAt: fixedTime(21),
      },
      {
        chunkId: pressChunk0.id,
        kind: 'RELATIONSHIP',
        status: 'PENDING',
        subjectName: 'ACME Bio',
        subjectType: 'ORG',
        objectName: 'Trial X',
        objectType: 'TRIAL',
        relation: 'RUNS_TRIAL',
        startOffset: relOffsets.start,
        endOffset: relOffsets.end,
        excerpt: suggestionExcerpt,
        createdAt: fixedTime(22),
      },
    ],
    skipDuplicates: true,
  });
  counts.aiSuggestions = 2;

  return { counts };
}

