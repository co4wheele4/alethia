/**
 * Ensures every UUID cited in docs/demo/feature-walkthrough.md appears in
 * aletheia-backend/scripts/seed/test-seed.lib.ts (so demo docs stay aligned with seed IDs).
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const walkthroughPath = path.join(root, 'docs', 'demo', 'feature-walkthrough.md');
const seedPath = path.join(root, 'aletheia-backend', 'scripts', 'seed', 'test-seed.lib.ts');

function main() {
  const walkthrough = fs.readFileSync(walkthroughPath, 'utf8');
  const seed = fs.readFileSync(seedPath, 'utf8');

  const uuidRe = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi;
  const inMd = new Set();
  let m;
  while ((m = uuidRe.exec(walkthrough)) !== null) {
    inMd.add(m[0].toLowerCase());
  }

  const seedLower = seed.toLowerCase();
  const missing = [];
  for (const id of inMd) {
    if (!seedLower.includes(id)) {
      missing.push(id);
    }
  }

  if (missing.length) {
    console.error(
      'verify-demo-ids: UUIDs in docs/demo/feature-walkthrough.md not found in test-seed.lib.ts:\n',
      missing.join('\n'),
    );
    process.exit(1);
  }

  console.log(`verify-demo-ids: OK (${inMd.size} UUIDs in walkthrough checked against seed).`);
}

main();
