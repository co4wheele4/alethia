/* eslint-disable no-console */
/**
 * Validates docs/adr/index.json:
 * - Contains ADR-001 .. ADR-038
 * - Required keys per entry
 * - ACCEPTED ADRs have non-empty enforcement
 * - Referenced files exist (repo-relative)
 */
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');

function fail(msg) {
  console.error(`ADR_INDEX: ${msg}`);
  process.exitCode = 1;
}

function fileExists(relPosix) {
  const p = path.join(repoRoot, ...relPosix.split('/'));
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
}

function main() {
  const indexPath = path.join(repoRoot, 'docs', 'adr', 'index.json');
  if (!fs.existsSync(indexPath)) {
    fail(`Missing ${path.relative(repoRoot, indexPath)}`);
    return;
  }

  let data;
  try {
    data = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  } catch (e) {
    fail(`Invalid JSON: ${e.message}`);
    return;
  }

  if (data.schemaVersion !== 1) {
    fail(`schemaVersion must be 1`);
  }

  const adrs = data.adrs;
  if (!adrs || typeof adrs !== 'object') {
    fail('Missing "adrs" object');
    return;
  }

  const allowedStatus = new Set(['ACCEPTED', 'REJECTED', 'SUPERSEDED', 'PROPOSED']);

  for (let n = 1; n <= 38; n += 1) {
    const id = `ADR-${String(n).padStart(3, '0')}`;
    const entry = adrs[id];
    if (!entry) {
      fail(`Missing key ${id}`);
      continue;
    }

    const { title, status, implementation, tests, enforcement } = entry;
    if (typeof title !== 'string' || !title.trim()) {
      fail(`${id}: missing title`);
    }
    if (typeof status !== 'string' || !allowedStatus.has(status)) {
      fail(`${id}: status must be one of ACCEPTED|REJECTED|SUPERSEDED|PROPOSED`);
    }
    for (const arrName of ['implementation', 'tests', 'enforcement']) {
      const arr = entry[arrName];
      if (!Array.isArray(arr) || arr.some((x) => typeof x !== 'string')) {
        fail(`${id}: "${arrName}" must be an array of strings`);
      }
    }

    if (status === 'ACCEPTED' && (enforcement?.length ?? 0) < 1) {
      fail(`${id}: ACCEPTED ADRs must list at least one enforcement path`);
    }

    for (const rel of [...implementation, ...tests, ...enforcement]) {
      if (!rel || rel.includes('*')) continue;
      if (!fileExists(rel)) {
        fail(`${id}: missing file "${rel}"`);
      }
    }
  }

  if (process.exitCode !== 1) {
    console.log('ADR index validation passed.');
  }
}

main();
