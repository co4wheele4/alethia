// test/helpers/test-setup.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { cleanDatabase, seedTestData } from './test-db';

export interface TestData {
  user: { id: string; email: string };
  lesson: { id: string; title: string };
  document: { id: string; title: string };
  chunk: { id: string; chunkIndex: number };
  entity: { id: string; name: string };
}

export interface TestContext {
  app: INestApplication;
  prisma: PrismaService;
  testData: TestData;
}

/**
 * Sets up the test application and database
 * Call this in beforeAll hook
 */
export async function setupTestApp(): Promise<TestContext> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  const prisma = moduleFixture.get<PrismaService>(PrismaService);

  await app.init();
  await cleanDatabase(prisma);
  const testData = await seedTestData(prisma);

  return { app, prisma, testData };
}

/**
 * Tears down the test application and database
 * Call this in afterAll hook
 */
export async function teardownTestApp(context: TestContext): Promise<void> {
  await cleanDatabase(context.prisma);
  await context.prisma.$disconnect();
  await context.app.close();
}

