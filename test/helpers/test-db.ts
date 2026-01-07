// test/helpers/test-db.ts
import { PrismaClient } from '@prisma/client';

export async function cleanDatabase(prisma: PrismaClient) {
  // Delete in reverse order of dependencies
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
}

export async function seedTestData(prisma: PrismaClient) {
  const user = await prisma.user.create({
    data: {
      email: 'test@example.com',
      name: 'Test User',
    },
  });

  const lesson = await prisma.lesson.create({
    data: {
      title: 'Test Lesson',
      content: 'Test content',
      userId: user.id,
    },
  });

  const document = await prisma.document.create({
    data: {
      title: 'Test Document',
      userId: user.id,
    },
  });

  const chunk = await prisma.documentChunk.create({
    data: {
      documentId: document.id,
      chunkIndex: 0,
      content: 'Test chunk content',
    },
  });

  const entity = await prisma.entity.create({
    data: {
      name: 'Test Entity',
      type: 'TestType',
    },
  });

  return { user, lesson, document, chunk, entity };
}
