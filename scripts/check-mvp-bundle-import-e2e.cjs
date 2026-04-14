#!/usr/bin/env node
/**
 * Fail-fast: ADR-031 / ADR-027 real-DB bundle import e2e must remain in the tree
 * so CI cannot silently drop Postgres-backed restore proof.
 */
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const p = path.join(
  repoRoot,
  'aletheia-backend',
  'test',
  'e2e',
  'bundle',
  'bundle-import-adr027.e2e-spec.ts',
);

if (!fs.existsSync(p)) {
  console.error(
    'MVP check: missing bundle import e2e — expected:',
    path.relative(repoRoot, p),
  );
  process.exit(1);
}
console.log('MVP check: bundle import e2e present OK');
