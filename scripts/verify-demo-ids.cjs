/**
 * Ensures every UUID cited in demo docs and the headed Playwright walkthrough appears in
 * aletheia-backend/scripts/seed/test-seed.lib.ts (so demo surfaces stay aligned with seed IDs).
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const sources = [
  path.join(root, 'docs', 'demo', 'feature-walkthrough.md'),
  path.join(root, 'aletheia-frontend', 'e2e', 'full-demo-walkthrough.spec.ts'),
];
const seedPath = path.join(root, 'aletheia-backend', 'scripts', 'seed', 'test-seed.lib.ts');

function main() {
  const seed = fs.readFileSync(seedPath, 'utf8');
  const uuidRe = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi;

  const allIds = new Set();
  const byFile = [];

  for (const filePath of sources) {
    const text = fs.readFileSync(filePath, 'utf8');
    const ids = new Set();
    let m;
    while ((m = uuidRe.exec(text)) !== null) {
      const id = m[0].toLowerCase();
      ids.add(id);
      allIds.add(id);
    }
    byFile.push({ rel: path.relative(root, filePath), count: ids.size });
  }

  const seedLower = seed.toLowerCase();
  const missing = [];
  for (const id of allIds) {
    if (!seedLower.includes(id)) {
      missing.push(id);
    }
  }

  if (missing.length) {
    console.error(
      'verify-demo-ids: UUIDs in demo sources not found in test-seed.lib.ts:\n',
      missing.join('\n'),
    );
    process.exit(1);
  }

  const parts = byFile.map((f) => `${f.rel} (${f.count})`).join(', ');
  console.log(`verify-demo-ids: OK (${allIds.size} unique UUIDs across sources; ${parts}).`);
}

main();
