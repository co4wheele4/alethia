import 'dotenv/config';
// NOTE: Import from `@prisma/config` (not `prisma/config`) to avoid resolving
// to our local `prisma/config.ts` when TypeScript uses `baseUrl: "."`.
import { defineConfig, env } from '@prisma/config';

/**
 * Prisma 7 configuration
 *
 * Epistemic note:
 * - We keep connection configuration out of `schema.prisma` to avoid leaking or hardcoding datasource URLs.
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});

