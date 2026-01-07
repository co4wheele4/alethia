// test/db-setup-verification.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { cleanDatabase, seedTestData } from './helpers/test-db';

describe('Database Setup and Teardown Verification (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);

    await app.init();
  });

  afterAll(async () => {
    // Clean up any test data created during verification
    await cleanDatabase(prisma);
    await prisma.$disconnect();
    await app.close();
  });

  describe('Database Cleanup', () => {
    it('should clean database completely', async () => {
      // First, create some test data
      const user = await prisma.user.create({
        data: {
          email: 'cleanup-test@example.com',
          name: 'Cleanup Test User',
        },
      });

      await prisma.lesson.create({
        data: {
          title: 'Cleanup Test Lesson',
          content: 'Test content',
          userId: user.id,
        },
      });

      // Verify data exists
      const usersBefore = await prisma.user.findMany();
      const lessonsBefore = await prisma.lesson.findMany();
      expect(usersBefore.length).toBeGreaterThan(0);
      expect(lessonsBefore.length).toBeGreaterThan(0);

      // Clean database
      await cleanDatabase(prisma);

      // Verify all data is removed
      const usersAfter = await prisma.user.findMany();
      const lessonsAfter = await prisma.lesson.findMany();
      const documentsAfter = await prisma.document.findMany();
      const chunksAfter = await prisma.documentChunk.findMany();
      const entitiesAfter = await prisma.entity.findMany();
      const embeddingsAfter = await prisma.embedding.findMany();
      const mentionsAfter = await prisma.entityMention.findMany();
      const relationshipsAfter = await prisma.entityRelationship.findMany();
      const aiQueriesAfter = await prisma.aiQuery.findMany();
      const aiQueryResultsAfter = await prisma.aiQueryResult.findMany();

      expect(usersAfter).toHaveLength(0);
      expect(lessonsAfter).toHaveLength(0);
      expect(documentsAfter).toHaveLength(0);
      expect(chunksAfter).toHaveLength(0);
      expect(entitiesAfter).toHaveLength(0);
      expect(embeddingsAfter).toHaveLength(0);
      expect(mentionsAfter).toHaveLength(0);
      expect(relationshipsAfter).toHaveLength(0);
      expect(aiQueriesAfter).toHaveLength(0);
      expect(aiQueryResultsAfter).toHaveLength(0);
    });
  });

  describe('Seed Data Creation', () => {
    beforeEach(async () => {
      await cleanDatabase(prisma);
    });

    afterEach(async () => {
      await cleanDatabase(prisma);
    });

    it('should create all required seed data', async () => {
      const testData = await seedTestData(prisma);

      // Verify user was created
      expect(testData.user).toBeDefined();
      expect(testData.user.id).toBeDefined();
      expect(testData.user.email).toBe('test@example.com');
      expect(testData.user.name).toBe('Test User');

      // Verify user exists in database
      const userInDb = await prisma.user.findUnique({
        where: { id: testData.user.id },
      });
      expect(userInDb).toBeDefined();
      expect(userInDb?.email).toBe('test@example.com');

      // Verify lesson was created
      expect(testData.lesson).toBeDefined();
      expect(testData.lesson.id).toBeDefined();
      expect(testData.lesson.title).toBe('Test Lesson');
      expect(testData.lesson.content).toBe('Test content');

      // Verify lesson exists in database and is linked to user
      const lessonInDb = await prisma.lesson.findUnique({
        where: { id: testData.lesson.id },
      });
      expect(lessonInDb).toBeDefined();
      expect(lessonInDb?.title).toBe('Test Lesson');
      expect(lessonInDb?.userId).toBe(testData.user.id);

      // Verify document was created
      expect(testData.document).toBeDefined();
      expect(testData.document.id).toBeDefined();
      expect(testData.document.title).toBe('Test Document');

      // Verify document exists in database and is linked to user
      const documentInDb = await prisma.document.findUnique({
        where: { id: testData.document.id },
      });
      expect(documentInDb).toBeDefined();
      expect(documentInDb?.title).toBe('Test Document');
      expect(documentInDb?.userId).toBe(testData.user.id);

      // Verify chunk was created
      expect(testData.chunk).toBeDefined();
      expect(testData.chunk.id).toBeDefined();
      expect(testData.chunk.chunkIndex).toBe(0);
      expect(testData.chunk.content).toBe('Test chunk content');

      // Verify chunk exists in database and is linked to document
      const chunkInDb = await prisma.documentChunk.findUnique({
        where: { id: testData.chunk.id },
      });
      expect(chunkInDb).toBeDefined();
      expect(chunkInDb?.chunkIndex).toBe(0);
      expect(chunkInDb?.documentId).toBe(testData.document.id);

      // Verify entity was created
      expect(testData.entity).toBeDefined();
      expect(testData.entity.id).toBeDefined();
      expect(testData.entity.name).toBe('Test Entity');
      expect(testData.entity.type).toBe('TestType');

      // Verify entity exists in database
      const entityInDb = await prisma.entity.findUnique({
        where: { id: testData.entity.id },
      });
      expect(entityInDb).toBeDefined();
      expect(entityInDb?.name).toBe('Test Entity');
      expect(entityInDb?.type).toBe('TestType');
    });

    it('should create seed data with proper relationships', async () => {
      const testData = await seedTestData(prisma);

      // Verify user-lesson relationship
      const userWithLessons = await prisma.user.findUnique({
        where: { id: testData.user.id },
        include: { lessons: true },
      });
      expect(userWithLessons?.lessons).toHaveLength(1);
      expect(userWithLessons?.lessons[0]?.id).toBe(testData.lesson.id);

      // Verify user-document relationship
      const userWithDocuments = await prisma.user.findUnique({
        where: { id: testData.user.id },
        include: { documents: true },
      });
      expect(userWithDocuments?.documents).toHaveLength(1);
      expect(userWithDocuments?.documents[0]?.id).toBe(testData.document.id);

      // Verify document-chunk relationship
      const documentWithChunks = await prisma.document.findUnique({
        where: { id: testData.document.id },
        include: { chunks: true },
      });
      expect(documentWithChunks?.chunks).toHaveLength(1);
      expect(documentWithChunks?.chunks[0]?.id).toBe(testData.chunk.id);
    });

    it('should allow multiple seed operations (idempotent cleanup)', async () => {
      // Seed first time
      const testData1 = await seedTestData(prisma);
      expect(testData1.user.id).toBeDefined();

      // Clean and seed again
      await cleanDatabase(prisma);
      const testData2 = await seedTestData(prisma);
      expect(testData2.user.id).toBeDefined();

      // IDs should be different (new records)
      expect(testData1.user.id).not.toBe(testData2.user.id);
      expect(testData1.lesson.id).not.toBe(testData2.lesson.id);
      expect(testData1.document.id).not.toBe(testData2.document.id);
    });
  });

  describe('Test Data Accessibility', () => {
    let testData: Awaited<ReturnType<typeof seedTestData>>;

    beforeEach(async () => {
      await cleanDatabase(prisma);
      testData = await seedTestData(prisma);
    });

    afterEach(async () => {
      await cleanDatabase(prisma);
    });

    it('should make seed data accessible to all tests', async () => {
      // Verify testData is accessible
      expect(testData).toBeDefined();
      expect(testData.user).toBeDefined();
      expect(testData.lesson).toBeDefined();
      expect(testData.document).toBeDefined();
      expect(testData.chunk).toBeDefined();
      expect(testData.entity).toBeDefined();

      // Verify data can be queried via Prisma
      const user = await prisma.user.findUnique({
        where: { id: testData.user.id },
      });
      expect(user).toBeDefined();

      const lesson = await prisma.lesson.findUnique({
        where: { id: testData.lesson.id },
      });
      expect(lesson).toBeDefined();

      const document = await prisma.document.findUnique({
        where: { id: testData.document.id },
      });
      expect(document).toBeDefined();
    });

    it('should allow tests to use seed data for GraphQL queries', async () => {
      // This simulates how actual tests use testData
      const userId = testData.user.id;
      const lessonId = testData.lesson.id;
      const documentId = testData.document.id;
      const chunkId = testData.chunk.id;
      const entityId = testData.entity.id;

      // Verify all IDs are valid UUIDs
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(userId).toMatch(uuidRegex);
      expect(lessonId).toMatch(uuidRegex);
      expect(documentId).toMatch(uuidRegex);
      expect(chunkId).toMatch(uuidRegex);
      expect(entityId).toMatch(uuidRegex);

      // Verify records exist and can be queried
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
      const document = await prisma.document.findUnique({
        where: { id: documentId },
      });
      const chunk = await prisma.documentChunk.findUnique({
        where: { id: chunkId },
      });
      const entity = await prisma.entity.findUnique({ where: { id: entityId } });

      expect(user).toBeDefined();
      expect(lesson).toBeDefined();
      expect(document).toBeDefined();
      expect(chunk).toBeDefined();
      expect(entity).toBeDefined();
    });
  });
});

