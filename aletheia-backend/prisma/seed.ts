import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { resolve } from 'path';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

import { evidenceContentSha256Hex } from '../src/common/utils/evidence-content-hash';

// Load .env.test if NODE_ENV is test or if explicitly requested, otherwise load .env
const isTestEnvironment = process.env.NODE_ENV === 'test' || process.env.SEED_TEST_DB === 'true';
if (isTestEnvironment) {
  const envTestPath = resolve(process.cwd(), '.env.test');
  try {
    config({ path: envTestPath });
    // Ensure we're using test database
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('/aletheia_test')) {
      process.env.DATABASE_URL = process.env.DATABASE_URL.replace(
        /\/([^\/\?]+)(\?|$)/,
        '/aletheia_test$2'
      );
    }
  } catch {
    // If .env.test doesn't exist, try to modify existing DATABASE_URL
    config();
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('/aletheia_test')) {
      process.env.DATABASE_URL = process.env.DATABASE_URL.replace(
        /\/([^\/\?]+)(\?|$)/,
        '/aletheia_test$2'
      );
    }
  }
} else {
  config();
}

function createPrismaClient() {
  const datasourceUrl = process.env.DATABASE_URL;
  if (!datasourceUrl || datasourceUrl.trim().length === 0) {
    throw new Error(
      'DATABASE_URL is required for seeding. No default or inferred datasource is permitted.',
    );
  }
  const pool = new Pool({ connectionString: datasourceUrl });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  return { prisma, pool };
}

const { prisma, pool } = createPrismaClient();

// Extract database name from DATABASE_URL
function getDatabaseName(): string {
  const dbUrl = process.env.DATABASE_URL || '';
  const match = dbUrl.match(/\/([^/?]+)(\?|$)/);
  return match ? match[1] : 'unknown';
}

async function main() {
  const databaseName = getDatabaseName();
  console.log(`\n🌱 Starting seed process for database: ${databaseName}\n`);
  
  // Safety check: Warn if attempting to seed production in non-production mode
  if (databaseName === 'devdb' && process.env.NODE_ENV !== 'production') {
    console.warn(
      `⚠️  WARNING: You are about to seed the production database "${databaseName}".\n` +
        `   This should only be done explicitly in production environments.\n` +
        `   If this is unintended, ensure DATABASE_URL points to the correct database.\n`
    );
    // Uncomment the following line to add a hard stop (requires confirmation):
    // throw new Error('Production database seeding requires explicit confirmation');
  }

  // Clear existing data (dependency order — matches test/helpers/test-db.ts)
  console.log('Clearing existing data...');
  await prisma.reviewerResponse.deleteMany();
  await prisma.reviewAssignment.deleteMany();
  await prisma.reviewRequest.deleteMany();
  await prisma.adjudicationLog.deleteMany();
  await prisma.claimEvidenceLink.deleteMany();
  await prisma.claimEvidence.deleteMany();
  await prisma.claim.deleteMany();
  await prisma.evidence.deleteMany();
  await prisma.aiQueryResult.deleteMany();
  await prisma.aiQuery.deleteMany();
  await prisma.embedding.deleteMany();
  await prisma.entityMention.deleteMany();
  await prisma.entityRelationship.deleteMany();
  await prisma.entity.deleteMany();
  await prisma.documentChunk.deleteMany();
  await prisma.document.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.user.deleteMany();
  console.log('✓ Existing data cleared\n');

  // Track inserted rows by table
  const counts = {
    users: 0,
    lessons: 0,
    documents: 0,
    documentChunks: 0,
    embeddings: 0,
    entities: 0,
    entityMentions: 0,
    aiQueries: 0,
    aiQueryResults: 0,
  };

  // Insert users
  const passwordHash = await bcrypt.hash('password123', 10);
  const alice = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: { email: 'alice@example.com', name: 'Alice', passwordHash },
  });
  counts.users++;
  console.log(`✓ Inserted ${counts.users} user(s)`);

  // Insert lessons
  const lesson = await prisma.lesson.create({
    data: { title: 'Introduction to Aletheia', content: 'This lesson explains the purpose of the Aletheia project.', userId: alice.id },
  });
  counts.lessons++;
  console.log(`✓ Inserted ${counts.lessons} lesson(s)`);

  // Insert documents
  const document = await prisma.document.create({
    data: { title: 'Aletheia Intro Document', userId: alice.id },
  });
  counts.documents++;
  console.log(`✓ Inserted ${counts.documents} document(s)`);

  // Insert document chunks
  const chunk = await prisma.documentChunk.create({
    data: {
      documentId: document.id,
      chunkIndex: 0,
      content: 'This chunk mentions Test Entity.',
    },
  });
  counts.documentChunks++;
  console.log(`✓ Inserted ${counts.documentChunks} document chunk(s)`);

  // Insert embeddings
  await prisma.embedding.create({ data: { chunkId: chunk.id, values: [0.1, 0.2, 0.3] } });
  counts.embeddings++;
  console.log(`✓ Inserted ${counts.embeddings} embedding(s)`);

  // Insert entities
  const entity = await prisma.entity.create({ data: { name: 'Test Entity', type: 'TestType' } });
  counts.entities++;
  console.log(`✓ Inserted ${counts.entities} entity/entities`);

  // Insert entity mentions
  const mention = await prisma.entityMention.create({
    data: {
      entityId: entity.id,
      chunkId: chunk.id,
      startOffset: 20,
      endOffset: 31,
      excerpt: 'Test Entity',
    },
  });
  counts.entityMentions++;
  console.log(`✓ Inserted ${counts.entityMentions} entity mention(s)`);

  // Insert claims (REVIEWED) with explicit evidence links (ADR-005/008/011).
  await prisma.claim.create({
    data: {
      id: 'claim-review-accept',
      text: 'Test Entity is mentioned in the intro document.',
      status: 'REVIEWED',
      evidence: {
        create: [
          {
            id: 'cev-accept-1',
            documentId: document.id,
            mentionLinks: { create: [{ mentionId: mention.id }] },
          },
        ],
      },
    },
  });
  await prisma.claim.create({
    data: {
      id: 'claim-review-reject',
      text: 'The intro document contains sufficient evidence to review this claim.',
      status: 'REVIEWED',
      evidence: {
        create: [
          {
            id: 'cev-reject-1',
            documentId: document.id,
            mentionLinks: { create: [{ mentionId: mention.id }] },
          },
        ],
      },
    },
  });
  await prisma.claim.create({
    data: {
      id: 'claim-review-draft',
      text: 'Draft claim used to assert invalid transition errors.',
      status: 'DRAFT',
      evidence: {
        create: [
          {
            id: 'cev-draft-1',
            documentId: document.id,
            mentionLinks: { create: [{ mentionId: mention.id }] },
          },
        ],
      },
    },
  });
  // ADR-023: visible legacy anchor without mention/relationship links → not evidence-closed for adjudication.
  await prisma.claim.create({
    data: {
      id: 'claim-adjudication-no-closure',
      text: 'Legacy evidence row without mention or relationship links (ADR-023 E2E).',
      status: 'DRAFT',
      evidence: {
        create: [{ id: 'cev-no-closure-1', documentId: document.id }],
      },
    },
  });

  // ADR-019/024: GraphQL `claim.evidence` prefers ClaimEvidenceLink → Evidence with chunk offsets.
  // Legacy-only rows map to null locators; the review UI needs real spans for E2E.
  const verbatimSnippet = chunk.content.slice(20, 31);
  const reviewSnippetSha = evidenceContentSha256Hex(verbatimSnippet);

  const evidenceAccept = await prisma.evidence.create({
    data: {
      createdBy: alice.id,
      sourceType: 'DOCUMENT',
      sourceDocumentId: document.id,
      chunkId: chunk.id,
      startOffset: 20,
      endOffset: 31,
      snippet: verbatimSnippet,
      contentSha256: reviewSnippetSha,
    },
  });
  await prisma.claimEvidenceLink.create({
    data: { claimId: 'claim-review-accept', evidenceId: evidenceAccept.id },
  });

  const evidenceReject = await prisma.evidence.create({
    data: {
      createdBy: alice.id,
      sourceType: 'DOCUMENT',
      sourceDocumentId: document.id,
      chunkId: chunk.id,
      startOffset: 20,
      endOffset: 31,
      snippet: verbatimSnippet,
      contentSha256: reviewSnippetSha,
    },
  });
  await prisma.claimEvidenceLink.create({
    data: { claimId: 'claim-review-reject', evidenceId: evidenceReject.id },
  });

  // Insert AI queries
  const query = await prisma.aiQuery.create({ data: { userId: alice.id, query: 'Explain chunk 0 in simple terms' } });
  counts.aiQueries++;
  console.log(`✓ Inserted ${counts.aiQueries} AI query/queries`);

  // Insert AI query results
  await prisma.aiQueryResult.create({ data: { queryId: query.id, answer: 'Chunk 0 introduces the purpose of the Aletheia project.' } });
  counts.aiQueryResults++;
  console.log(`✓ Inserted ${counts.aiQueryResults} AI query result(s)`);

  // Summary
  const totalRows = Object.values(counts).reduce((sum, count) => sum + count, 0);
  console.log(`\n✅ Seed completed successfully!`);
  console.log(`📊 Summary:`);
  console.log(`   - Users: ${counts.users}`);
  console.log(`   - Lessons: ${counts.lessons}`);
  console.log(`   - Documents: ${counts.documents}`);
  console.log(`   - Document Chunks: ${counts.documentChunks}`);
  console.log(`   - Embeddings: ${counts.embeddings}`);
  console.log(`   - Entities: ${counts.entities}`);
  console.log(`   - Entity Mentions: ${counts.entityMentions}`);
  console.log(`   - AI Queries: ${counts.aiQueries}`);
  console.log(`   - AI Query Results: ${counts.aiQueryResults}`);
  console.log(`   - Total rows inserted: ${totalRows}`);
  console.log(`🗄️  Database: ${databaseName}\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
