// test/setup-e2e.ts
import 'dotenv/config';

// Set test environment variables if not already set
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    process.env.TEST_DATABASE_URL ||
    'postgresql://user:password@localhost:5432/aletheia_test';
}
