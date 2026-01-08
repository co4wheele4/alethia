import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

// Extract database name from DATABASE_URL
function getDatabaseName(): string {
  const dbUrl = process.env.DATABASE_URL || '';
  const match = dbUrl.match(/\/([^/?]+)(\?|$)/);
  return match ? match[1] : 'unknown';
}

async function main() {
  const databaseName = getDatabaseName();
  console.log(`\n🌱 Starting seed process for database: ${databaseName}\n`);

  // Clear existing data
  console.log('Clearing existing data...');
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
  const alice = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: { email: 'alice@example.com', name: 'Alice' },
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
    data: { documentId: document.id, chunkIndex: 0, content: 'Aletheia is a system for truth discovery using AI.' },
  });
  counts.documentChunks++;
  console.log(`✓ Inserted ${counts.documentChunks} document chunk(s)`);

  // Insert embeddings
  await prisma.embedding.create({ data: { chunkId: chunk.id, values: [0.1, 0.2, 0.3] } });
  counts.embeddings++;
  console.log(`✓ Inserted ${counts.embeddings} embedding(s)`);

  // Insert entities
  const entity = await prisma.entity.create({ data: { name: 'Aletheia', type: 'Project' } });
  counts.entities++;
  console.log(`✓ Inserted ${counts.entities} entity/entities`);

  // Insert entity mentions
  await prisma.entityMention.create({ data: { entityId: entity.id, chunkId: chunk.id } });
  counts.entityMentions++;
  console.log(`✓ Inserted ${counts.entityMentions} entity mention(s)`);

  // Insert AI queries
  const query = await prisma.aiQuery.create({ data: { userId: alice.id, query: 'Explain chunk 0 in simple terms' } });
  counts.aiQueries++;
  console.log(`✓ Inserted ${counts.aiQueries} AI query/queries`);

  // Insert AI query results
  await prisma.aiQueryResult.create({ data: { queryId: query.id, answer: 'Chunk 0 introduces the purpose of the Aletheia project.', score: 0.95 } });
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
  });
