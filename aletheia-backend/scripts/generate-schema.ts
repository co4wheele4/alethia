/**
 * P0: Backend schema snapshot generator.
 *
 * Purpose:
 * - Generate/update the committed code-first schema snapshot at `src/schema.gql`.
 *
 * Notes:
 * - This script intentionally does NOT start an HTTP server.
 * - It requires a real DATABASE_URL because PrismaService fails fast without one.
 * - It forces NODE_ENV=development by default to avoid requiring production secrets for
 *   schema generation (schema generation itself is not a privileged runtime).
 */
import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app/app.module';

async function main() {
  process.env.NODE_ENV ||= 'development';
  process.env.OPENAI_DISABLE_NETWORK ||= 'true';

  const dbUrl = process.env.DATABASE_URL ?? '';
  if (dbUrl.trim().length === 0) {
    // PrismaService requires an explicit DATABASE_URL to initialize.
    // Keep the error loud and actionable.

    console.error(
      'SCHEMA_SNAPSHOT_DRIFT: DATABASE_URL is required to generate backend schema snapshot.',
    );
    process.exit(1);
  }

  const app = await NestFactory.create(AppModule, { logger: false });
  await app.init();
  await app.close();
}

main().catch((err) => {
  console.error('SCHEMA_SNAPSHOT_DRIFT: Failed to generate schema snapshot.');

  console.error(err);
  process.exit(1);
});
