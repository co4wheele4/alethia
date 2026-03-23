/**
 * Migrates claim_evidence → evidence + claim_evidence_links (ADR-019).
 *
 * Run after applying migration 20260130000000_adr019_evidence_semantics.
 * Uses Prisma; ensure DATABASE_URL is set.
 *
 * Usage: node scripts/migrate-claim-evidence-to-adr019.cjs
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const { randomUUID } = require('crypto');

const url = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/aletheia';
const pool = new Pool({ connectionString: url });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function migrate() {
  const skipped = [];
  let created = 0;
  let linked = 0;

  const allClaimEvidence = await prisma.claimEvidence.findMany({
    include: {
      claim: true,
      document: { include: { chunks: { orderBy: { chunkIndex: 'asc' } } } },
      mentionLinks: { include: { mention: true } },
      relationshipLinks: {
        include: {
          relationship: {
            include: { evidence: { take: 1, orderBy: { createdAt: 'asc' } } },
          },
        },
      },
    },
  });

  for (const ce of allClaimEvidence) {
    const claimId = ce.claimId;
    const documentId = ce.documentId;
    const createdAt = ce.createdAt;
    const createdBy = ce.document.userId;
    const evidenceIdsForClaim = new Set();

    // 1. From mentions
    for (const { mention } of ce.mentionLinks) {
      const chunk = mention.chunkId
        ? await prisma.documentChunk.findUnique({
            where: { id: mention.chunkId },
            select: { id: true, documentId: true, content: true },
          })
        : null;
      if (!chunk || chunk.documentId !== documentId) {
        skipped.push({ reason: 'mention_chunk_invalid', claimEvidenceId: ce.id, mentionId: mention.id });
        continue;
      }
      const start = mention.startOffset ?? 0;
      const end = mention.endOffset ?? chunk.content?.length ?? 0;
      const evidence = await prisma.evidence.create({
        data: {
          id: randomUUID(),
          createdAt,
          createdBy,
          sourceType: 'DOCUMENT',
          sourceDocumentId: documentId,
          chunkId: chunk.id,
          startOffset: start,
          endOffset: end,
          snippet: mention.excerpt ?? undefined,
        },
      });
      created++;
      evidenceIdsForClaim.add(evidence.id);
    }

    // 2. From relationships (when no mentions)
    if (ce.mentionLinks.length === 0) {
      for (const { relationship } of ce.relationshipLinks) {
        const ere = relationship.evidence?.[0];
        if (!ere) {
          skipped.push({
            reason: 'relationship_no_evidence',
            claimEvidenceId: ce.id,
            relationshipId: relationship.id,
          });
          continue;
        }
        const chunk = await prisma.documentChunk.findUnique({
          where: { id: ere.chunkId },
          select: { id: true, documentId: true, content: true },
        });
        if (!chunk || chunk.documentId !== documentId) {
          skipped.push({
            reason: 'rel_evidence_chunk_invalid',
            claimEvidenceId: ce.id,
            relationshipId: relationship.id,
          });
          continue;
        }
        const start = ere.startOffset ?? 0;
        const end = ere.endOffset ?? chunk.content?.length ?? 0;
        const evidence = await prisma.evidence.create({
          data: {
            id: randomUUID(),
            createdAt,
            createdBy,
            sourceType: 'DOCUMENT',
            sourceDocumentId: documentId,
            chunkId: chunk.id,
            startOffset: start,
            endOffset: end,
            snippet: ere.quotedText ?? undefined,
          },
        });
        created++;
        evidenceIdsForClaim.add(evidence.id);
      }
    }

    // 3. No mention/relationship links: use first chunk
    if (evidenceIdsForClaim.size === 0 && ce.document.chunks.length > 0) {
      const fc = ce.document.chunks[0];
      const evidence = await prisma.evidence.create({
        data: {
          id: randomUUID(),
          createdAt,
          createdBy,
          sourceType: 'DOCUMENT',
          sourceDocumentId: documentId,
          chunkId: fc.id,
          startOffset: 0,
          endOffset: fc.content?.length ?? 0,
        },
      });
      created++;
      evidenceIdsForClaim.add(evidence.id);
    } else if (evidenceIdsForClaim.size === 0) {
      skipped.push({
        reason: 'no_chunks',
        claimEvidenceId: ce.id,
        documentId,
        claimId,
      });
    }

    // Link evidence to claim
    for (const evidenceId of evidenceIdsForClaim) {
      await prisma.claimEvidenceLink.upsert({
        where: { evidenceId_claimId: { evidenceId, claimId } },
        create: { evidenceId, claimId },
        update: {},
      });
      linked++;
    }
  }

  console.log(`ADR-019 migration: created ${created} evidence, ${linked} links, skipped ${skipped.length}`);
  if (skipped.length > 0) {
    console.log('Skipped rows:', JSON.stringify(skipped, null, 2));
  }
}

migrate()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
