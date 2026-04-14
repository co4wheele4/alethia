/**
 * ADR-026: Batch reproducibility checks for URL evidence.
 *
 * Usage:
 *   npx tsx scripts/jobs/runEvidenceReproCheck.ts
 *   npx tsx scripts/jobs/runEvidenceReproCheck.ts --evidenceId=<uuid>
 *   npx tsx scripts/jobs/runEvidenceReproCheck.ts --olderThanHours=24
 *
 * Run from repo root with DATABASE_URL set (or .env loaded).
 */
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../aletheia-backend/src/app/app.module';
import { EvidenceReproCheckService } from '../../aletheia-backend/src/evidence-repro/evidence-repro-check.service';

function parseArgs() {
  const evidenceId = process.argv.find((a) => a.startsWith('--evidenceId='))?.split('=')[1];
  const olderRaw = process.argv.find((a) => a.startsWith('--olderThanHours='))?.split('=')[1];
  const olderThanHours = olderRaw !== undefined ? Number(olderRaw) : undefined;
  return { evidenceId, olderThanHours };
}

async function main() {
  process.env.NODE_ENV ||= 'development';
  process.env.OPENAI_DISABLE_NETWORK ||= 'true';

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  const svc = app.get(EvidenceReproCheckService);
  const { evidenceId, olderThanHours } = parseArgs();
  const r = await svc.runBatch({ evidenceId, olderThanHours });
  // eslint-disable-next-line no-console
  console.log(`Evidence repro checks processed: ${r.processed}`);
  await app.close();
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
