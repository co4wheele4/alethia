// test/helpers/test-setup.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { cleanDatabase, seedTestData } from './test-db';

export interface TestData {
  admin: { id: string; email: string };
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
  auth: { userToken: string; adminToken: string };
}

/**
 * Sets up the test application and database
 * Call this in beforeAll hook
 */
export async function setupTestApp(): Promise<TestContext> {
  // Verify we're using the test database before proceeding
  const dbUrl = process.env.DATABASE_URL || '';
  const dbMatch = dbUrl.match(/\/([^/?]+)(\?|$)/);
  const dbName = dbMatch ? dbMatch[1] : 'unknown';

  if (dbName !== 'aletheia_test') {
    throw new Error(
      `⚠️  SAFETY CHECK FAILED: Test setup detected database "${dbName}" instead of "aletheia_test". ` +
        `This prevents accidental operations on production. ` +
        `Current DATABASE_URL: ${dbUrl.replace(/:[^:@]+@/, ':****@') || 'not set'}`,
    );
  }

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  const prisma = moduleFixture.get<PrismaService>(PrismaService);

  await app.init();
  await cleanDatabase(prisma);
  const testData = await seedTestData(prisma);

  // Obtain JWTs for the seeded users so e2e tests can hit guarded resolvers.
  // The AuthResolver's `login` is intentionally unguarded.
  const { graphqlRequest } = await import('./graphql-request');

  const loginMutation = `
    mutation Login($email: String!, $password: String!) {
      login(email: $email, password: $password)
    }
  `;

  const userLoginRes = await graphqlRequest<{ login?: string }>(
    app,
    loginMutation,
    {
      email: testData.user.email,
      password: 'password',
    },
  );
  const adminLoginRes = await graphqlRequest<{ login?: string }>(
    app,
    loginMutation,
    {
      email: testData.admin.email,
      password: 'password',
    },
  );

  const userToken = userLoginRes.body?.data?.login;
  const adminToken = adminLoginRes.body?.data?.login;

  if (!userToken || !adminToken) {
    const userErr =
      userLoginRes.body?.errors?.map((e) => e.message).join(' | ') || '';
    const adminErr =
      adminLoginRes.body?.errors?.map((e) => e.message).join(' | ') || '';
    throw new Error(
      [
        'Failed to obtain auth tokens for e2e tests',
        `userLogin: status=${userLoginRes.status} token=${Boolean(userToken)} errors=${userErr || '(none)'}`,
        `adminLogin: status=${adminLoginRes.status} token=${Boolean(adminToken)} errors=${adminErr || '(none)'}`,
      ].join('\n'),
    );
  }

  // Default to the admin token so admin-only mutations (e.g. createUser) work in e2e tests
  // without needing every call site to pass an explicit auth token.
  globalThis.__ALETHEIA_E2E_AUTH_TOKEN__ = adminToken;

  return { app, prisma, testData, auth: { userToken, adminToken } };
}

/**
 * Tears down the test application and database
 * Call this in afterAll hook
 */
export async function teardownTestApp(context: TestContext): Promise<void> {
  // Be resilient: if setup failed, Jest will still run afterAll hooks in some cases.
  if (!context) return;
  try {
    await cleanDatabase(context.prisma);
  } finally {
    // Always attempt graceful shutdown.
    await context.prisma?.$disconnect?.();
    await context.app?.close?.();
  }
}
