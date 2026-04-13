/**
 * Deterministic full-database test seed (ADR-018/019/023 compliant).
 * Exported for reuse by CLI and integration tests.
 */
import {
  ClaimStatus,
  DocumentSourceKind,
  EvidenceSourceKind,
  RelationshipEvidenceKind,
  ReviewerResponseType,
  ReviewRequestSource,
} from '@prisma/client';
import type { PrismaClient } from '@prisma/client';

import { evidenceContentSha256Hex } from '../../src/common/utils/evidence-content-hash';

/** Fixed bcrypt hash for password "password123" (cost 10). */
export const TEST_SEED_PASSWORD_HASH =
  '$2b$10$dKBsvunilUDDif84TxU.1.9Fj3vS2cMgP9LqgylIj7dlUQ7oJUzrC';

export const IDS = {
  users: {
    admin: '10000000-0000-4000-8000-000000000001',
    reviewer1: '10000000-0000-4000-8000-000000000002',
    reviewer2: '10000000-0000-4000-8000-000000000003',
    reviewer3: '10000000-0000-4000-8000-000000000004',
    author1: '10000000-0000-4000-8000-000000000005',
    author2: '10000000-0000-4000-8000-000000000006',
  },
  documents: {
    d1: '20000000-0000-4000-8000-000000000001',
    d2: '20000000-0000-4000-8000-000000000002',
    d3: '20000000-0000-4000-8000-000000000003',
  },
  chunks: {
    k1: '21000000-0000-4000-8000-000000000001',
    k2: '21000000-0000-4000-8000-000000000002',
    k3: '21000000-0000-4000-8000-000000000003',
    k4: '21000000-0000-4000-8000-000000000004',
  },
  claims: {
    draftNoEv1: 'c0000001-0000-4000-8000-000000000001',
    draftNoEv2: 'c0000002-0000-4000-8000-000000000002',
    draftWithEvNoRr: 'c0000003-0000-4000-8000-000000000003',
    reviewedCentral: 'c0000004-0000-4000-8000-000000000004',
    reviewedSecA: 'c0000005-0000-4000-8000-000000000005',
    reviewedSecB: 'c0000006-0000-4000-8000-000000000006',
    accepted1: 'c0000007-0000-4000-8000-000000000007',
    accepted2: 'c0000008-0000-4000-8000-000000000008',
    accepted3: 'c0000009-0000-4000-8000-000000000009',
    rejected1: 'c0000010-0000-4000-8000-000000000010',
    rejected2: 'c0000011-0000-4000-8000-000000000011',
    rejected3: 'c0000012-0000-4000-8000-000000000012',
  },
  evidence: {
    e01: 'e0000001-0000-4000-8000-000000000001',
    e02: 'e0000002-0000-4000-8000-000000000002',
    e03: 'e0000003-0000-4000-8000-000000000003',
    e04: 'e0000004-0000-4000-8000-000000000004',
    e05: 'e0000005-0000-4000-8000-000000000005',
    e06: 'e0000006-0000-4000-8000-000000000006',
    e07: 'e0000007-0000-4000-8000-000000000007',
    e08: 'e0000008-0000-4000-8000-000000000008',
    e09: 'e0000009-0000-4000-8000-000000000009',
    e10: 'e0000010-0000-4000-8000-000000000010',
    e11: 'e0000011-0000-4000-8000-000000000011',
    e12: 'e0000012-0000-4000-8000-000000000012',
    e13: 'e0000013-0000-4000-8000-000000000013',
    e14: 'e0000014-0000-4000-8000-000000000014',
    e15: 'e0000015-0000-4000-8000-000000000015',
    e16: 'e0000016-0000-4000-8000-000000000016',
    e17: 'e0000017-0000-4000-8000-000000000017',
    e18: 'e0000018-0000-4000-8000-000000000018',
    e19: 'e0000019-0000-4000-8000-000000000019',
    e20: 'e0000020-0000-4000-8000-000000000020',
    e21: 'e0000021-0000-4000-8000-000000000021',
    e22: 'e0000022-0000-4000-8000-000000000022',
    e23: 'e0000023-0000-4000-8000-000000000023',
    e24: 'e0000024-0000-4000-8000-000000000024',
  },
  reviewRequests: {
    rr1: 'r0000001-0000-4000-8000-000000000001',
    rr2: 'r0000002-0000-4000-8000-000000000002',
    rr3: 'r0000003-0000-4000-8000-000000000003',
    rr4: 'r0000004-0000-4000-8000-000000000004',
    rr5: 'r0000005-0000-4000-8000-000000000005',
  },
  assignments: {
    a1: 'b0000001-0000-4000-8000-000000000001',
    a2: 'b0000002-0000-4000-8000-000000000002',
    a3: 'b0000003-0000-4000-8000-000000000003',
    a4: 'b0000004-0000-4000-8000-000000000004',
    a5: 'b0000005-0000-4000-8000-000000000005',
    a6: 'b0000006-0000-4000-8000-000000000006',
    a7: 'b0000007-0000-4000-8000-000000000007',
    a8: 'b0000008-0000-4000-8000-000000000008',
  },
  responses: {
    resp1: 'f0000001-0000-4000-8000-000000000001',
    resp2: 'f0000002-0000-4000-8000-000000000002',
    resp3: 'f0000003-0000-4000-8000-000000000003',
    resp4: 'f0000004-0000-4000-8000-000000000004',
    resp5: 'f0000005-0000-4000-8000-000000000005',
    resp6: 'f0000006-0000-4000-8000-000000000006',
  },
  entities: {
    policyAc: '30000001-0000-4000-8000-000000000001',
    mfaControl: '30000002-0000-4000-8000-000000000002',
  },
  mentions: {
    mPolicy: '31000001-0000-4000-8000-000000000001',
    mMfa: '31000002-0000-4000-8000-000000000002',
  },
  entityRelationships: {
    policyRequiresMfa: '32000001-0000-4000-8000-000000000001',
  },
  relationshipEvidence: {
    rePolicyMfa: '33000001-0000-4000-8000-000000000001',
  },
} as const;

const T0 = new Date('2024-06-01T12:00:00.000Z');
export function fixedTime(offsetMinutes: number): Date {
  return new Date(T0.getTime() + offsetMinutes * 60_000);
}

const CHUNK_TEXT: Record<keyof typeof IDS.chunks, string> = {
  k1: 'POLICY-AC-2024-03: Production access requires MFA enrollment before account activation. SECTION-QA: Release checklists are stored in the engineering wiki at path /docs/releases/checklist.md.',
  k2: 'CONTRACT-APPENDIX-B: Payment is due within thirty calendar days of invoice date. Late fees apply after day thirty-one.',
  k3: 'INCIDENT-2024-07-14: Service X maintenance window was published on the status page with scheduled start and end times.',
  k4: 'HR-HANDBOOK-7.2: Remote employees must acknowledge the acceptable use policy annually. The acknowledgment is recorded in the HR system of record.',
};

function span(
  chunkKey: keyof typeof IDS.chunks,
  needle: string,
): { start: number; end: number; snippet: string } {
  const content = CHUNK_TEXT[chunkKey];
  const start = content.indexOf(needle);
  if (start < 0) throw new Error(`needle not found: ${needle}`);
  const end = start + needle.length;
  return { start, end, snippet: content.slice(start, end) };
}

type EvidenceDef = {
  id: string;
  chunkKey: keyof typeof IDS.chunks;
  needle: string;
  documentId: string;
  createdBy: string;
  createdAt: Date;
};

function buildEvidenceRow(def: EvidenceDef) {
  const { start, end, snippet } = span(def.chunkKey, def.needle);
  const chunkId = IDS.chunks[def.chunkKey];
  return {
    id: def.id,
    createdAt: def.createdAt,
    createdBy: def.createdBy,
    sourceType: EvidenceSourceKind.DOCUMENT,
    sourceDocumentId: def.documentId,
    sourceUrl: null,
    chunkId,
    startOffset: start,
    endOffset: end,
    snippet,
    contentSha256: evidenceContentSha256Hex(snippet),
  };
}

export async function wipeAllTables(prisma: PrismaClient): Promise<void> {
  await prisma.reviewerResponse.deleteMany();
  await prisma.reviewAssignment.deleteMany();
  await prisma.reviewRequest.deleteMany();
  await prisma.adjudicationLog.deleteMany();
  await prisma.claimEvidenceLink.deleteMany();
  await prisma.claimEvidenceMention.deleteMany();
  await prisma.claimEvidenceRelationship.deleteMany();
  await prisma.claimEvidence.deleteMany();
  await prisma.claim.deleteMany();
  await prisma.evidence.deleteMany();
  await prisma.entityRelationshipEvidenceMention.deleteMany();
  await prisma.entityRelationshipEvidence.deleteMany();
  await prisma.aiExtractionSuggestion.deleteMany();
  await prisma.aiQueryResult.deleteMany();
  await prisma.aiQuery.deleteMany();
  await prisma.embedding.deleteMany();
  await prisma.entityMention.deleteMany();
  await prisma.entityRelationship.deleteMany();
  await prisma.entity.deleteMany();
  await prisma.documentSource.deleteMany();
  await prisma.documentChunk.deleteMany();
  await prisma.document.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.user.deleteMany();
}

const FORBIDDEN_SUBSTRINGS = [
  'confidence',
  'likely',
  'probable',
  'strong evidence',
  'weak evidence',
  'ranking',
  ' top ',
  ' best ',
] as const;

function assertNoForbiddenLanguage(text: string, context: string): void {
  const lower = text.toLowerCase();
  for (const s of FORBIDDEN_SUBSTRINGS) {
    if (lower.includes(s)) {
      throw new Error(`Forbidden language in ${context}: "${s}"`);
    }
  }
}

export async function insertTestSeed(prisma: PrismaClient): Promise<void> {
  const u = IDS.users;
  const cids = IDS.claims;
  const ev = IDS.evidence;

  await prisma.user.createMany({
    data: [
      {
        id: u.admin,
        email: 'seed-admin@aletheia.test',
        name: 'Seed Admin',
        role: 'ADMIN',
        passwordHash: TEST_SEED_PASSWORD_HASH,
        createdAt: fixedTime(0),
      },
      {
        id: u.reviewer1,
        email: 'seed-reviewer1@aletheia.test',
        name: 'Seed Reviewer One',
        role: 'USER',
        passwordHash: TEST_SEED_PASSWORD_HASH,
        createdAt: fixedTime(1),
      },
      {
        id: u.reviewer2,
        email: 'seed-reviewer2@aletheia.test',
        name: 'Seed Reviewer Two',
        role: 'USER',
        passwordHash: TEST_SEED_PASSWORD_HASH,
        createdAt: fixedTime(2),
      },
      {
        id: u.reviewer3,
        email: 'seed-reviewer3@aletheia.test',
        name: 'Seed Reviewer Three',
        role: 'USER',
        passwordHash: TEST_SEED_PASSWORD_HASH,
        createdAt: fixedTime(3),
      },
      {
        id: u.author1,
        email: 'seed-author1@aletheia.test',
        name: 'Seed Author One',
        role: 'USER',
        passwordHash: TEST_SEED_PASSWORD_HASH,
        createdAt: fixedTime(4),
      },
      {
        id: u.author2,
        email: 'seed-author2@aletheia.test',
        name: 'Seed Author Two',
        role: 'USER',
        passwordHash: TEST_SEED_PASSWORD_HASH,
        createdAt: fixedTime(5),
      },
    ],
  });

  await prisma.document.createMany({
    data: [
      {
        id: IDS.documents.d1,
        title: 'Access control policy excerpt',
        userId: u.author1,
        createdAt: fixedTime(10),
        sourceType: DocumentSourceKind.MANUAL,
        sourceLabel: 'policy/ac-2024-03-excerpt.txt',
      },
      {
        id: IDS.documents.d2,
        title: 'Contract appendix B excerpt',
        userId: u.author2,
        createdAt: fixedTime(11),
        sourceType: DocumentSourceKind.MANUAL,
        sourceLabel: 'contracts/appendix-b.txt',
      },
      {
        id: IDS.documents.d3,
        title: 'Incident communication excerpt',
        userId: u.author1,
        createdAt: fixedTime(12),
        sourceType: DocumentSourceKind.MANUAL,
        sourceLabel: 'incidents/2024-07-14-status.txt',
      },
    ],
  });

  await prisma.documentChunk.createMany({
    data: [
      {
        id: IDS.chunks.k1,
        documentId: IDS.documents.d1,
        chunkIndex: 0,
        content: CHUNK_TEXT.k1,
      },
      {
        id: IDS.chunks.k2,
        documentId: IDS.documents.d2,
        chunkIndex: 0,
        content: CHUNK_TEXT.k2,
      },
      {
        id: IDS.chunks.k3,
        documentId: IDS.documents.d3,
        chunkIndex: 0,
        content: CHUNK_TEXT.k3,
      },
      {
        id: IDS.chunks.k4,
        documentId: IDS.documents.d1,
        chunkIndex: 1,
        content: CHUNK_TEXT.k4,
      },
    ],
  });

  const ent = IDS.entities;
  const ment = IDS.mentions;
  const er = IDS.entityRelationships;
  const re = IDS.relationshipEvidence;

  const policyMentionSpan = span('k1', 'POLICY-AC-2024-03');
  const mfaMentionSpan = span('k1', 'MFA enrollment');
  const relationshipEvidenceSpan = span('k1', 'MFA enrollment before account activation');

  await prisma.entity.createMany({
    data: [
      { id: ent.policyAc, name: 'Policy AC-2024-03', type: 'POLICY' },
      { id: ent.mfaControl, name: 'MFA enrollment', type: 'CONTROL' },
    ],
  });

  await prisma.entityMention.createMany({
    data: [
      {
        id: ment.mPolicy,
        entityId: ent.policyAc,
        chunkId: IDS.chunks.k1,
        startOffset: policyMentionSpan.start,
        endOffset: policyMentionSpan.end,
        excerpt: policyMentionSpan.snippet,
      },
      {
        id: ment.mMfa,
        entityId: ent.mfaControl,
        chunkId: IDS.chunks.k1,
        startOffset: mfaMentionSpan.start,
        endOffset: mfaMentionSpan.end,
        excerpt: mfaMentionSpan.snippet,
      },
    ],
  });

  await prisma.entityRelationship.createMany({
    data: [
      {
        id: er.policyRequiresMfa,
        fromEntity: ent.policyAc,
        toEntity: ent.mfaControl,
        relation: 'requires',
      },
    ],
  });

  await prisma.entityRelationshipEvidence.createMany({
    data: [
      {
        id: re.rePolicyMfa,
        relationshipId: er.policyRequiresMfa,
        chunkId: IDS.chunks.k1,
        kind: RelationshipEvidenceKind.TEXT_SPAN,
        startOffset: relationshipEvidenceSpan.start,
        endOffset: relationshipEvidenceSpan.end,
        quotedText: relationshipEvidenceSpan.snippet,
        createdAt: fixedTime(15),
      },
    ],
  });

  await prisma.entityRelationshipEvidenceMention.createMany({
    data: [
      {
        evidenceId: re.rePolicyMfa,
        mentionId: ment.mMfa,
      },
    ],
  });

  const evidenceDefs: EvidenceDef[] = [
    {
      id: ev.e01,
      chunkKey: 'k1',
      needle: 'MFA enrollment before account activation',
      documentId: IDS.documents.d1,
      createdBy: u.author1,
      createdAt: fixedTime(20),
    },
    {
      id: ev.e02,
      chunkKey: 'k1',
      needle: '/docs/releases/checklist.md',
      documentId: IDS.documents.d1,
      createdBy: u.author1,
      createdAt: fixedTime(21),
    },
    {
      id: ev.e03,
      chunkKey: 'k2',
      needle: 'thirty calendar days of invoice date',
      documentId: IDS.documents.d2,
      createdBy: u.author2,
      createdAt: fixedTime(22),
    },
    {
      id: ev.e04,
      chunkKey: 'k3',
      needle: 'scheduled start and end times',
      documentId: IDS.documents.d3,
      createdBy: u.author1,
      createdAt: fixedTime(23),
    },
    {
      id: ev.e05,
      chunkKey: 'k4',
      needle: 'acceptable use policy annually',
      documentId: IDS.documents.d1,
      createdBy: u.author1,
      createdAt: fixedTime(24),
    },
    {
      id: ev.e06,
      chunkKey: 'k2',
      needle: 'Late fees apply after day thirty-one',
      documentId: IDS.documents.d2,
      createdBy: u.author2,
      createdAt: fixedTime(25),
    },
    {
      id: ev.e07,
      chunkKey: 'k3',
      needle: 'status page',
      documentId: IDS.documents.d3,
      createdBy: u.author1,
      createdAt: fixedTime(26),
    },
    {
      id: ev.e08,
      chunkKey: 'k1',
      needle: 'SECTION-QA: Release checklists',
      documentId: IDS.documents.d1,
      createdBy: u.author1,
      createdAt: fixedTime(27),
    },
    {
      id: ev.e09,
      chunkKey: 'k2',
      needle: 'CONTRACT-APPENDIX-B: Payment is due',
      documentId: IDS.documents.d2,
      createdBy: u.author2,
      createdAt: fixedTime(28),
    },
    {
      id: ev.e10,
      chunkKey: 'k4',
      needle: 'HR system of record',
      documentId: IDS.documents.d1,
      createdBy: u.author1,
      createdAt: fixedTime(29),
    },
    {
      id: ev.e11,
      chunkKey: 'k3',
      needle: 'INCIDENT-2024-07-14: Service X maintenance',
      documentId: IDS.documents.d3,
      createdBy: u.author1,
      createdAt: fixedTime(30),
    },
    {
      id: ev.e12,
      chunkKey: 'k1',
      needle: 'POLICY-AC-2024-03: Production access requires',
      documentId: IDS.documents.d1,
      createdBy: u.author1,
      createdAt: fixedTime(31),
    },
    {
      id: ev.e13,
      chunkKey: 'k2',
      needle: 'invoice date',
      documentId: IDS.documents.d2,
      createdBy: u.author2,
      createdAt: fixedTime(32),
    },
    {
      id: ev.e14,
      chunkKey: 'k3',
      needle: 'maintenance window was published',
      documentId: IDS.documents.d3,
      createdBy: u.author1,
      createdAt: fixedTime(33),
    },
    {
      id: ev.e15,
      chunkKey: 'k1',
      needle: 'engineering wiki at path',
      documentId: IDS.documents.d1,
      createdBy: u.author1,
      createdAt: fixedTime(34),
    },
    {
      id: ev.e16,
      chunkKey: 'k2',
      needle: 'CONTRACT-APPENDIX-B',
      documentId: IDS.documents.d2,
      createdBy: u.author2,
      createdAt: fixedTime(35),
    },
    {
      id: ev.e17,
      chunkKey: 'k4',
      needle: 'Remote employees must acknowledge',
      documentId: IDS.documents.d1,
      createdBy: u.author1,
      createdAt: fixedTime(36),
    },
    {
      id: ev.e18,
      chunkKey: 'k1',
      needle: 'account activation',
      documentId: IDS.documents.d1,
      createdBy: u.author1,
      createdAt: fixedTime(37),
    },
    {
      id: ev.e19,
      chunkKey: 'k2',
      needle: 'Payment is due within thirty calendar days',
      documentId: IDS.documents.d2,
      createdBy: u.author2,
      createdAt: fixedTime(38),
    },
    {
      id: ev.e20,
      chunkKey: 'k3',
      needle: 'published on the status page',
      documentId: IDS.documents.d3,
      createdBy: u.author1,
      createdAt: fixedTime(39),
    },
    {
      id: ev.e21,
      chunkKey: 'k4',
      needle: 'HR-HANDBOOK-7.2',
      documentId: IDS.documents.d1,
      createdBy: u.author1,
      createdAt: fixedTime(40),
    },
    {
      id: ev.e22,
      chunkKey: 'k1',
      needle: 'Release checklists are stored',
      documentId: IDS.documents.d1,
      createdBy: u.author1,
      createdAt: fixedTime(41),
    },
    {
      id: ev.e23,
      chunkKey: 'k2',
      needle: 'Late fees apply',
      documentId: IDS.documents.d2,
      createdBy: u.author2,
      createdAt: fixedTime(42),
    },
    {
      id: ev.e24,
      chunkKey: 'k3',
      needle: 'Service X maintenance window',
      documentId: IDS.documents.d3,
      createdBy: u.author1,
      createdAt: fixedTime(43),
    },
  ];

  const evidenceRows: ReturnType<typeof buildEvidenceRow>[] = [];
  for (const def of evidenceDefs) {
    evidenceRows.push(buildEvidenceRow(def));
  }
  await prisma.evidence.createMany({
    data: evidenceRows,
  });

  const claimRows: {
    id: string;
    text: string;
    status: ClaimStatus;
    createdAt: Date;
    reviewedAt: Date | null;
    reviewedBy: string | null;
    reviewerNote: string | null;
  }[] = [
    {
      id: cids.draftNoEv1,
      text: 'The company policy requires MFA for production access.',
      status: ClaimStatus.DRAFT,
      createdAt: fixedTime(100),
      reviewedAt: null,
      reviewedBy: null,
      reviewerNote: null,
    },
    {
      id: cids.draftNoEv2,
      text: 'The contract states payment is due within 30 days.',
      status: ClaimStatus.DRAFT,
      createdAt: fixedTime(101),
      reviewedAt: null,
      reviewedBy: null,
      reviewerNote: null,
    },
    {
      id: cids.draftWithEvNoRr,
      text: 'Service X experienced downtime on 2024-07-14.',
      status: ClaimStatus.DRAFT,
      createdAt: fixedTime(102),
      reviewedAt: null,
      reviewedBy: null,
      reviewerNote: null,
    },
    {
      id: cids.reviewedCentral,
      text: 'Production access is governed by policy AC-2024-03.',
      status: ClaimStatus.REVIEWED,
      createdAt: fixedTime(103),
      reviewedAt: fixedTime(150),
      reviewedBy: u.admin,
      reviewerNote: 'Moved into review via adjudication seed.',
    },
    {
      id: cids.reviewedSecA,
      text: 'Release checklists are referenced from the engineering wiki.',
      status: ClaimStatus.REVIEWED,
      createdAt: fixedTime(104),
      reviewedAt: fixedTime(151),
      reviewedBy: u.admin,
      reviewerNote: 'Moved into review via adjudication seed.',
    },
    {
      id: cids.reviewedSecB,
      text: 'Contract appendix B specifies payment timing language.',
      status: ClaimStatus.REVIEWED,
      createdAt: fixedTime(105),
      reviewedAt: fixedTime(152),
      reviewedBy: u.admin,
      reviewerNote: 'Moved into review via adjudication seed.',
    },
    {
      id: cids.accepted1,
      text: 'The invoicing clause uses a thirty-day payment window.',
      status: ClaimStatus.ACCEPTED,
      createdAt: fixedTime(106),
      reviewedAt: fixedTime(200),
      reviewedBy: u.admin,
      reviewerNote: 'Accepted via adjudication seed.',
    },
    {
      id: cids.accepted2,
      text: 'Incident communications for Service X referenced the status page.',
      status: ClaimStatus.ACCEPTED,
      createdAt: fixedTime(107),
      reviewedAt: fixedTime(201),
      reviewedBy: u.admin,
      reviewerNote: 'Accepted via adjudication seed.',
    },
    {
      id: cids.accepted3,
      text: 'HR handbook section 7.2 mentions annual acknowledgment.',
      status: ClaimStatus.ACCEPTED,
      createdAt: fixedTime(108),
      reviewedAt: fixedTime(202),
      reviewedBy: u.admin,
      reviewerNote: 'Accepted via adjudication seed.',
    },
    {
      id: cids.rejected1,
      text: 'Late fee language applies starting on day thirty-two.',
      status: ClaimStatus.REJECTED,
      createdAt: fixedTime(109),
      reviewedAt: fixedTime(250),
      reviewedBy: u.admin,
      reviewerNote: 'Rejected via adjudication seed.',
    },
    {
      id: cids.rejected2,
      text: 'Maintenance windows are always announced without a published end time.',
      status: ClaimStatus.REJECTED,
      createdAt: fixedTime(110),
      reviewedAt: fixedTime(251),
      reviewedBy: u.admin,
      reviewerNote: 'Rejected via adjudication seed.',
    },
    {
      id: cids.rejected3,
      text: 'Remote work policy acknowledgment is optional.',
      status: ClaimStatus.REJECTED,
      createdAt: fixedTime(111),
      reviewedAt: fixedTime(252),
      reviewedBy: u.admin,
      reviewerNote: 'Rejected via adjudication seed.',
    },
  ];

  for (const row of claimRows) {
    assertNoForbiddenLanguage(row.text, `claim ${row.id}`);
  }

  // ADR-027: DB trigger requires evidence links to exist before a claim row is INSERTed as
  // REVIEWED/ACCEPTED/REJECTED. Insert lifecycle claims as DRAFT first, attach evidence, insert
  // adjudication logs, then UPDATE to final statuses (logs must exist before terminal status).
  const initialClaimRows = claimRows.map((row) => {
    if (
      row.id === cids.draftNoEv1 ||
      row.id === cids.draftNoEv2 ||
      row.id === cids.draftWithEvNoRr
    ) {
      return row;
    }
    return {
      ...row,
      status: ClaimStatus.DRAFT,
      reviewedAt: null,
      reviewedBy: null,
      reviewerNote: null,
    };
  });

  await prisma.claim.createMany({ data: initialClaimRows });

  const links: { evidenceId: string; claimId: string; linkedAt: Date }[] = [
    // Showcase: central claim has five evidence rows
    {
      evidenceId: ev.e01,
      claimId: cids.reviewedCentral,
      linkedAt: fixedTime(120),
    },
    {
      evidenceId: ev.e02,
      claimId: cids.reviewedCentral,
      linkedAt: fixedTime(121),
    },
    {
      evidenceId: ev.e03,
      claimId: cids.reviewedCentral,
      linkedAt: fixedTime(122),
    },
    {
      evidenceId: ev.e04,
      claimId: cids.reviewedCentral,
      linkedAt: fixedTime(123),
    },
    {
      evidenceId: ev.e05,
      claimId: cids.reviewedCentral,
      linkedAt: fixedTime(124),
    },
    // Secondary claims share two evidence rows with central
    {
      evidenceId: ev.e01,
      claimId: cids.reviewedSecA,
      linkedAt: fixedTime(125),
    },
    {
      evidenceId: ev.e02,
      claimId: cids.reviewedSecA,
      linkedAt: fixedTime(126),
    },
    {
      evidenceId: ev.e01,
      claimId: cids.reviewedSecB,
      linkedAt: fixedTime(127),
    },
    {
      evidenceId: ev.e02,
      claimId: cids.reviewedSecB,
      linkedAt: fixedTime(128),
    },
    // e01 is also linked to accepted1 below (fourth claim — structural reuse across the graph)
    // draft with evidence (no review request)
    {
      evidenceId: ev.e07,
      claimId: cids.draftWithEvNoRr,
      linkedAt: fixedTime(130),
    },
    {
      evidenceId: ev.e20,
      claimId: cids.draftWithEvNoRr,
      linkedAt: fixedTime(131),
    },
    // accepted claims (3+ evidence where required)
    { evidenceId: ev.e01, claimId: cids.accepted1, linkedAt: fixedTime(132) },
    { evidenceId: ev.e09, claimId: cids.accepted1, linkedAt: fixedTime(133) },
    { evidenceId: ev.e19, claimId: cids.accepted1, linkedAt: fixedTime(134) },
    { evidenceId: ev.e11, claimId: cids.accepted2, linkedAt: fixedTime(135) },
    { evidenceId: ev.e14, claimId: cids.accepted2, linkedAt: fixedTime(136) },
    { evidenceId: ev.e24, claimId: cids.accepted2, linkedAt: fixedTime(137) },
    { evidenceId: ev.e17, claimId: cids.accepted3, linkedAt: fixedTime(138) },
    { evidenceId: ev.e21, claimId: cids.accepted3, linkedAt: fixedTime(139) },
    { evidenceId: ev.e10, claimId: cids.accepted3, linkedAt: fixedTime(140) },
    // rejected
    { evidenceId: ev.e23, claimId: cids.rejected1, linkedAt: fixedTime(141) },
    { evidenceId: ev.e13, claimId: cids.rejected1, linkedAt: fixedTime(142) },
    { evidenceId: ev.e04, claimId: cids.rejected2, linkedAt: fixedTime(143) },
    { evidenceId: ev.e20, claimId: cids.rejected2, linkedAt: fixedTime(144) },
    { evidenceId: ev.e05, claimId: cids.rejected3, linkedAt: fixedTime(145) },
    { evidenceId: ev.e22, claimId: cids.rejected3, linkedAt: fixedTime(146) },
  ];

  await prisma.claimEvidenceLink.createMany({ data: links });

  const adjudicationRows: {
    id: string;
    claimId: string;
    adjudicatorId: string;
    decision: string;
    previousStatus: ClaimStatus;
    newStatus: ClaimStatus;
    reviewerNote: string | null;
    createdAt: Date;
  }[] = [];

  // Deterministic adjudication log ids (one row per successful adjudication transition).
  const logIds = [
    'd1000001-0000-4000-8000-000000000001',
    'd1000002-0000-4000-8000-000000000002',
    'd1000003-0000-4000-8000-000000000003',
    'd1000004-0000-4000-8000-000000000004',
    'd1000005-0000-4000-8000-000000000005',
    'd1000006-0000-4000-8000-000000000006',
    'd1000007-0000-4000-8000-000000000007',
    'd1000008-0000-4000-8000-000000000008',
    'd1000009-0000-4000-8000-000000000009',
    'd1000010-0000-4000-8000-000000000010',
    'd1000011-0000-4000-8000-000000000011',
    'd1000012-0000-4000-8000-000000000012',
    'd1000013-0000-4000-8000-000000000013',
    'd1000014-0000-4000-8000-000000000014',
    'd1000015-0000-4000-8000-000000000015',
  ];
  let li = 0;
  function addLog(
    claimId: string,
    decision: string,
    previousStatus: ClaimStatus,
    newStatus: ClaimStatus,
    createdAt: Date,
    note: string | null,
  ) {
    adjudicationRows.push({
      id: logIds[li++],
      claimId,
      adjudicatorId: u.admin,
      decision,
      previousStatus,
      newStatus,
      reviewerNote: note,
      createdAt,
    });
  }

  addLog(
    cids.reviewedCentral,
    'REVIEW',
    ClaimStatus.DRAFT,
    ClaimStatus.REVIEWED,
    fixedTime(150),
    'Initial review transition (seed).',
  );
  addLog(
    cids.reviewedSecA,
    'REVIEW',
    ClaimStatus.DRAFT,
    ClaimStatus.REVIEWED,
    fixedTime(151),
    'Initial review transition (seed).',
  );
  addLog(
    cids.reviewedSecB,
    'REVIEW',
    ClaimStatus.DRAFT,
    ClaimStatus.REVIEWED,
    fixedTime(152),
    'Initial review transition (seed).',
  );

  for (const cid of [cids.accepted1, cids.accepted2, cids.accepted3] as const) {
    addLog(
      cid,
      'REVIEW',
      ClaimStatus.DRAFT,
      ClaimStatus.REVIEWED,
      fixedTime(180),
      'Review (seed).',
    );
    addLog(
      cid,
      'ACCEPTED',
      ClaimStatus.REVIEWED,
      ClaimStatus.ACCEPTED,
      fixedTime(200),
      'Accepted (seed).',
    );
  }
  for (const cid of [cids.rejected1, cids.rejected2, cids.rejected3] as const) {
    addLog(
      cid,
      'REVIEW',
      ClaimStatus.DRAFT,
      ClaimStatus.REVIEWED,
      fixedTime(220),
      'Review (seed).',
    );
    addLog(
      cid,
      'REJECTED',
      ClaimStatus.REVIEWED,
      ClaimStatus.REJECTED,
      fixedTime(250),
      'Rejected (seed).',
    );
  }

  await prisma.adjudicationLog.createMany({ data: adjudicationRows });

  await prisma.$transaction(async (tx) => {
    for (const id of [cids.reviewedCentral, cids.reviewedSecA, cids.reviewedSecB] as const) {
      const row = claimRows.find((r) => r.id === id)!;
      await tx.claim.update({
        where: { id },
        data: {
          status: ClaimStatus.REVIEWED,
          reviewedAt: row.reviewedAt,
          reviewedBy: row.reviewedBy,
          reviewerNote: row.reviewerNote,
        },
      });
    }
    for (const id of [cids.accepted1, cids.accepted2, cids.accepted3] as const) {
      const row = claimRows.find((r) => r.id === id)!;
      await tx.claim.update({
        where: { id },
        data: {
          status: ClaimStatus.REVIEWED,
          reviewedAt: fixedTime(180),
          reviewedBy: u.admin,
          reviewerNote: 'Review (seed).',
        },
      });
      await tx.claim.update({
        where: { id },
        data: {
          status: ClaimStatus.ACCEPTED,
          reviewedAt: row.reviewedAt,
          reviewedBy: row.reviewedBy,
          reviewerNote: row.reviewerNote,
        },
      });
    }
    for (const id of [cids.rejected1, cids.rejected2, cids.rejected3] as const) {
      const row = claimRows.find((r) => r.id === id)!;
      await tx.claim.update({
        where: { id },
        data: {
          status: ClaimStatus.REVIEWED,
          reviewedAt: fixedTime(220),
          reviewedBy: u.admin,
          reviewerNote: 'Review (seed).',
        },
      });
      await tx.claim.update({
        where: { id },
        data: {
          status: ClaimStatus.REJECTED,
          reviewedAt: row.reviewedAt,
          reviewedBy: row.reviewedBy,
          reviewerNote: row.reviewerNote,
        },
      });
    }
  });

  await prisma.reviewRequest.createMany({
    data: [
      {
        id: IDS.reviewRequests.rr1,
        claimId: cids.reviewedCentral,
        requestedByUserId: u.author1,
        requestedAt: fixedTime(160),
        source: ReviewRequestSource.CLAIM_VIEW,
        note: 'Request visibility for policy claim (coordination only).',
      },
      {
        id: IDS.reviewRequests.rr2,
        claimId: cids.reviewedSecA,
        requestedByUserId: u.author2,
        requestedAt: fixedTime(161),
        source: ReviewRequestSource.CLAIM_VIEW,
        note: 'Second author requests review attention.',
      },
      {
        id: IDS.reviewRequests.rr3,
        claimId: cids.reviewedSecB,
        requestedByUserId: u.author1,
        requestedAt: fixedTime(162),
        source: ReviewRequestSource.COMPARISON,
        note: 'Comparison-sourced request (coordination only).',
      },
      {
        id: IDS.reviewRequests.rr4,
        claimId: cids.accepted1,
        requestedByUserId: u.author2,
        requestedAt: fixedTime(163),
        source: ReviewRequestSource.CLAIM_VIEW,
        note: 'Post-acceptance coordination record (does not change lifecycle).',
      },
      {
        id: IDS.reviewRequests.rr5,
        claimId: cids.accepted2,
        requestedByUserId: u.author1,
        requestedAt: fixedTime(164),
        source: ReviewRequestSource.CLAIM_VIEW,
        note: 'Second coordination thread on accepted claim.',
      },
    ],
  });

  await prisma.reviewAssignment.createMany({
    data: [
      {
        id: IDS.assignments.a1,
        reviewRequestId: IDS.reviewRequests.rr2,
        reviewerUserId: u.reviewer1,
        assignedByUserId: u.admin,
        assignedAt: fixedTime(170),
      },
      {
        id: IDS.assignments.a2,
        reviewRequestId: IDS.reviewRequests.rr2,
        reviewerUserId: u.reviewer2,
        assignedByUserId: u.admin,
        assignedAt: fixedTime(171),
      },
      {
        id: IDS.assignments.a3,
        reviewRequestId: IDS.reviewRequests.rr3,
        reviewerUserId: u.reviewer1,
        assignedByUserId: u.author1,
        assignedAt: fixedTime(172),
      },
      {
        id: IDS.assignments.a4,
        reviewRequestId: IDS.reviewRequests.rr3,
        reviewerUserId: u.reviewer2,
        assignedByUserId: u.author1,
        assignedAt: fixedTime(173),
      },
      {
        id: IDS.assignments.a5,
        reviewRequestId: IDS.reviewRequests.rr4,
        reviewerUserId: u.reviewer1,
        assignedByUserId: u.author2,
        assignedAt: fixedTime(174),
      },
      {
        id: IDS.assignments.a6,
        reviewRequestId: IDS.reviewRequests.rr4,
        reviewerUserId: u.reviewer3,
        assignedByUserId: u.author2,
        assignedAt: fixedTime(175),
      },
      {
        id: IDS.assignments.a7,
        reviewRequestId: IDS.reviewRequests.rr5,
        reviewerUserId: u.reviewer2,
        assignedByUserId: u.author1,
        assignedAt: fixedTime(176),
      },
      {
        id: IDS.assignments.a8,
        reviewRequestId: IDS.reviewRequests.rr5,
        reviewerUserId: u.reviewer1,
        assignedByUserId: u.author1,
        assignedAt: fixedTime(177),
      },
    ],
  });

  await prisma.reviewerResponse.createMany({
    data: [
      {
        id: IDS.responses.resp1,
        reviewAssignmentId: IDS.assignments.a3,
        reviewerUserId: u.reviewer1,
        response: ReviewerResponseType.ACKNOWLEDGED,
        respondedAt: fixedTime(178),
        note: 'Acknowledged assignment (coordination only).',
      },
      {
        id: IDS.responses.resp2,
        reviewAssignmentId: IDS.assignments.a4,
        reviewerUserId: u.reviewer2,
        response: ReviewerResponseType.ACKNOWLEDGED,
        respondedAt: fixedTime(179),
        note: 'Acknowledged assignment (coordination only).',
      },
      {
        id: IDS.responses.resp3,
        reviewAssignmentId: IDS.assignments.a5,
        reviewerUserId: u.reviewer1,
        response: ReviewerResponseType.ACKNOWLEDGED,
        respondedAt: fixedTime(181),
        note: 'Acknowledged.',
      },
      {
        id: IDS.responses.resp4,
        reviewAssignmentId: IDS.assignments.a6,
        reviewerUserId: u.reviewer3,
        response: ReviewerResponseType.DECLINED,
        respondedAt: fixedTime(182),
        note: 'Declined due to capacity (coordination only).',
      },
      {
        id: IDS.responses.resp5,
        reviewAssignmentId: IDS.assignments.a7,
        reviewerUserId: u.reviewer2,
        response: ReviewerResponseType.ACKNOWLEDGED,
        respondedAt: fixedTime(183),
        note: 'Acknowledged.',
      },
      {
        id: IDS.responses.resp6,
        reviewAssignmentId: IDS.assignments.a8,
        reviewerUserId: u.reviewer1,
        response: ReviewerResponseType.ACKNOWLEDGED,
        respondedAt: fixedTime(184),
        note: 'Acknowledged.',
      },
    ],
  });

  const evRows = await prisma.evidence.findMany({ select: { snippet: true } });
  for (const r of evRows) {
    if (r.snippet) assertNoForbiddenLanguage(r.snippet, 'evidence snippet');
  }
}

export async function assertSeedIntegrity(prisma: PrismaClient): Promise<void> {
  const badReviewed = await prisma.claim.count({
    where: {
      status: ClaimStatus.REVIEWED,
      evidenceLinks: { none: {} },
      evidence: { none: {} },
    },
  });
  if (badReviewed !== 0) {
    throw new Error(
      `ADR-018: REVIEWED claims without evidence: ${badReviewed}`,
    );
  }

  const badAccepted = await prisma.claim.count({
    where: {
      status: ClaimStatus.ACCEPTED,
      evidenceLinks: { none: {} },
      evidence: { none: {} },
    },
  });
  if (badAccepted !== 0) {
    throw new Error(
      `ADR-018: ACCEPTED claims without evidence: ${badAccepted}`,
    );
  }

  const badRejected = await prisma.claim.count({
    where: {
      status: ClaimStatus.REJECTED,
      evidenceLinks: { none: {} },
      evidence: { none: {} },
    },
  });
  if (badRejected !== 0) {
    throw new Error(
      `ADR-018: REJECTED claims without evidence: ${badRejected}`,
    );
  }

  const evidenceCount = await prisma.evidence.count();
  const evidenceSnap = await prisma.evidence.findMany({
    orderBy: { id: 'asc' },
    select: {
      id: true,
      createdAt: true,
      snippet: true,
      contentSha256: true,
      sourceType: true,
    },
  });

  for (const e of evidenceSnap) {
    if (!e.snippet || !e.contentSha256) {
      throw new Error(`Evidence ${e.id} missing snippet or contentSha256`);
    }
    if (e.contentSha256 !== evidenceContentSha256Hex(e.snippet)) {
      throw new Error(
        `Evidence ${e.id} contentSha256 mismatch (immutability check)`,
      );
    }
    assertNoForbiddenLanguage(e.snippet, `evidence ${e.id}`);
  }

  const claims = await prisma.claim.findMany({
    select: { id: true, text: true },
  });
  for (const c of claims) {
    assertNoForbiddenLanguage(c.text, `claim ${c.id}`);
  }

  const acceptedNeedLogs = await prisma.claim.findMany({
    where: { status: ClaimStatus.ACCEPTED },
    select: { id: true },
  });
  for (const c of acceptedNeedLogs) {
    const n = await prisma.adjudicationLog.count({
      where: { claimId: c.id, newStatus: ClaimStatus.ACCEPTED },
    });
    if (n < 1)
      throw new Error(
        `Accepted claim ${c.id} missing ACCEPTED adjudication log`,
      );
  }

  const rejectedNeedLogs = await prisma.claim.findMany({
    where: { status: ClaimStatus.REJECTED },
    select: { id: true },
  });
  for (const c of rejectedNeedLogs) {
    const n = await prisma.adjudicationLog.count({
      where: { claimId: c.id, newStatus: ClaimStatus.REJECTED },
    });
    if (n < 1)
      throw new Error(
        `Rejected claim ${c.id} missing REJECTED adjudication log`,
      );
  }

  if (evidenceCount < 20) {
    throw new Error(`Expected at least 20 evidence rows, got ${evidenceCount}`);
  }

  const linkCount = await prisma.claimEvidenceLink.count();
  if (linkCount < 25) {
    throw new Error(
      `Expected at least 25 claim-evidence links, got ${linkCount}`,
    );
  }
}

export async function runTestSeed(prisma: PrismaClient): Promise<{
  counts: Record<string, number>;
}> {
  await wipeAllTables(prisma);
  await insertTestSeed(prisma);
  await assertSeedIntegrity(prisma);

  const counts = {
    users: await prisma.user.count(),
    documents: await prisma.document.count(),
    documentChunks: await prisma.documentChunk.count(),
    claims: await prisma.claim.count(),
    evidence: await prisma.evidence.count(),
    claimEvidenceLinks: await prisma.claimEvidenceLink.count(),
    reviewRequests: await prisma.reviewRequest.count(),
    reviewAssignments: await prisma.reviewAssignment.count(),
    reviewerResponses: await prisma.reviewerResponse.count(),
    adjudicationLogs: await prisma.adjudicationLog.count(),
  };

  return { counts };
}
