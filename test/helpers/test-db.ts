// test/helpers/test-db.ts
import { PrismaClient } from '@prisma/client';

/**
 * Extracts and verifies the database name from DATABASE_URL
 */
function getDatabaseName(): string {
  const dbUrl = process.env.DATABASE_URL || '';
  const match = dbUrl.match(/\/([^\/\?]+)(\?|$)/);
  return match ? match[1] : 'unknown';
}

/**
 * Verifies we're using the test database (safety check)
 */
function verifyTestDatabase(): void {
  const dbName = getDatabaseName();
  if (dbName !== 'aletheia_test') {
    throw new Error(
      `⚠️  SAFETY CHECK FAILED: Attempting to clean/seed database "${dbName}" instead of "aletheia_test". ` +
        `This prevents accidental operations on production. ` +
        `Current DATABASE_URL: ${process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@') || 'not set'}`
    );
  }
}

export async function cleanDatabase(prisma: PrismaClient) {
  verifyTestDatabase();
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
  verifyTestDatabase();
  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'ADMIN',
    },
  });

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

  return { admin, user, lesson, document, chunk, entity };
}
