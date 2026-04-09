/**
 * ADR-023 CI guard:
 * - Schema must not expose non-adjudication claim lifecycle mutations.
 * - Only ClaimAdjudicationService may call prisma.claim.update (status transitions).
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const schemaPath = path.join(root, 'src', 'schema.gql');
const srcRoot = path.join(root, 'src');

function read(p) {
  return fs.readFileSync(p, 'utf8');
}

function fail(msg) {
  console.error(`ADR-023 lifecycle integrity: ${msg}`);
  process.exit(1);
}

// --- Schema: forbidden mutation field names (lifecycle / batch adjudication) ---
const schema = read(schemaPath);
const mutationMatch = schema.match(/type Mutation\s*\{([\s\S]*?)\n\}/);
if (!mutationMatch) fail('Could not parse Mutation type in schema.gql');

const mutationBody = mutationMatch[1];
const forbiddenNames = [
  /\badjudicateClaims\b/i,
  /\bbatchAdjudicate\b/i,
  /\bupdateClaim\b/i,
  /\bsetClaimStatus\b/i,
  /\btransitionClaim\b/i,
];
for (const re of forbiddenNames) {
  if (re.test(mutationBody)) {
    fail(`Forbidden mutation surface in schema.gql (matches ${re})`);
  }
}
if (!/\badjudicateClaim\s*\(/.test(mutationBody)) {
  fail('schema.gql must declare adjudicateClaim mutation');
}

// --- Source: prisma.claim.update allowlist ---
const allowClaimUpdate = new Set([
  path.normalize(path.join(srcRoot, 'graphql', 'resolvers', 'claim-adjudication.service.ts')),
]);

function walk(dir, out) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === 'node_modules' || ent.name === 'dist') continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, out);
    else if (ent.isFile() && ent.name.endsWith('.ts')) out.push(full);
  }
}

const tsFiles = [];
walk(srcRoot, tsFiles);

const claimUpdateRe = /\bprisma\.claim\.update\s*\(/;
for (const file of tsFiles) {
  const rel = path.relative(root, file);
  if (rel.endsWith('.spec.ts')) continue;
  const text = read(file);
  if (!claimUpdateRe.test(text)) continue;
  const norm = path.normalize(file);
  if (!allowClaimUpdate.has(norm)) {
    fail(`Disallowed prisma.claim.update in ${rel} (ADR-023: only claim-adjudication.service.ts)`);
  }
}

console.log('ADR-023 lifecycle integrity checks passed.');
