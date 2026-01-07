import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

async function main() {
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

  const alice = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: { email: 'alice@example.com', name: 'Alice' },
  });

  const lesson = await prisma.lesson.create({
    data: { title: 'Introduction to Aletheia', content: 'This lesson explains the purpose of the Aletheia project.', userId: alice.id },
  });

  const document = await prisma.document.create({
    data: { title: 'Aletheia Intro Document', userId: alice.id },
  });

  const chunk = await prisma.documentChunk.create({
    data: { documentId: document.id, chunkIndex: 0, content: 'Aletheia is a system for truth discovery using AI.' },
  });

  await prisma.embedding.create({ data: { chunkId: chunk.id, values: [0.1, 0.2, 0.3] } });

  const entity = await prisma.entity.create({ data: { name: 'Aletheia', type: 'Project' } });

  await prisma.entityMention.create({ data: { entityId: entity.id, chunkId: chunk.id } });

  const query = await prisma.aiQuery.create({ data: { userId: alice.id, query: 'Explain chunk 0 in simple terms' } });

  await prisma.aiQueryResult.create({ data: { queryId: query.id, answer: 'Chunk 0 introduces the purpose of the Aletheia project.', score: 0.95 } });

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
