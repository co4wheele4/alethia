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

  // Track inserted rows
  let insertedCount = 0;

  // Insert users
  const alice = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: { email: 'alice@example.com', name: 'Alice' },
  });
  insertedCount++;
  console.log(`✓ Inserted ${insertedCount} user(s)`);

  // Insert lessons
  const lesson = await prisma.lesson.create({
    data: { title: 'Introduction to Aletheia', content: 'This lesson explains the purpose of the Aletheia project.', userId: alice.id },
  });
  insertedCount++;
  console.log(`✓ Inserted ${insertedCount - 1} lesson(s)`);

  // Insert documents
  const document = await prisma.document.create({
    data: { title: 'Aletheia Intro Document', userId: alice.id },
  });
  insertedCount++;
  console.log(`✓ Inserted ${insertedCount - 2} document(s)`);

  // Insert document chunks
  const chunk = await prisma.documentChunk.create({
    data: { documentId: document.id, chunkIndex: 0, content: 'Aletheia is a system for truth discovery using AI.' },
  });
  insertedCount++;
  console.log(`✓ Inserted ${insertedCount - 3} document chunk(s)`);

  // Insert embeddings
  await prisma.embedding.create({ data: { chunkId: chunk.id, values: [0.1, 0.2, 0.3] } });
  insertedCount++;
  console.log(`✓ Inserted ${insertedCount - 4} embedding(s)`);

  // Insert entities
  const entity = await prisma.entity.create({ data: { name: 'Aletheia', type: 'Project' } });
  insertedCount++;
  console.log(`✓ Inserted ${insertedCount - 5} entity/entities`);

  // Insert entity mentions
  await prisma.entityMention.create({ data: { entityId: entity.id, chunkId: chunk.id } });
  insertedCount++;
  console.log(`✓ Inserted ${insertedCount - 6} entity mention(s)`);

  // Insert AI queries
  const query = await prisma.aiQuery.create({ data: { userId: alice.id, query: 'Explain chunk 0 in simple terms' } });
  insertedCount++;
  console.log(`✓ Inserted ${insertedCount - 7} AI query/queries`);

  // Insert AI query results
  await prisma.aiQueryResult.create({ data: { queryId: query.id, answer: 'Chunk 0 introduces the purpose of the Aletheia project.', score: 0.95 } });
  insertedCount++;
  console.log(`✓ Inserted ${insertedCount - 8} AI query result(s)`);

  // Summary
  console.log(`\n✅ Seed completed successfully!`);
  console.log(`📊 Total rows inserted: ${insertedCount}`);
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
