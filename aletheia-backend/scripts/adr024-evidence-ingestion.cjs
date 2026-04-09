/**
 * ADR-024 CI: evidence ingestion constraints (no derived fields, no updateEvidence, content hash on model).
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const schemaPath = path.join(root, 'src', 'schema.gql');
const prismaPath = path.join(root, 'prisma', 'schema.prisma');

function read(p) {
  return fs.readFileSync(p, 'utf8');
}

function fail(msg) {
  console.error(`ADR-024 evidence ingestion: ${msg}`);
  process.exit(1);
}

const schema = read(schemaPath);
if (/\bupdateEvidence\b/.test(schema)) {
  fail('schema.gql must not declare updateEvidence');
}
if (!/\bcreateEvidence\b/.test(schema)) {
  fail('schema.gql must declare createEvidence');
}

const evidenceBlock = schema.match(/type Evidence\s*\{([^}]+)\}/s);
if (!evidenceBlock) fail('Could not parse type Evidence in schema.gql');

const evBody = evidenceBlock[1];
const forbidden = ['tags', 'summary', 'classification', 'confidence'];
for (const f of forbidden) {
  if (new RegExp(`\\b${f}\\b`, 'i').test(evBody)) {
    fail(`Forbidden derived field on Evidence: ${f}`);
  }
}
if (!/\bcontentSha256\b/.test(evBody)) {
  fail('Evidence type must expose contentSha256 (ADR-024)');
}

const prisma = read(prismaPath);
const modelBlock = prisma.match(/model Evidence\s*\{([^}]+)\}/s);
if (!modelBlock) fail('Could not parse model Evidence in prisma/schema.prisma');
const mb = modelBlock[1];
if (!/\bcontentSha256\b/.test(mb) && !/\bcontent_sha256\b/.test(mb)) {
  fail('Prisma Evidence must define contentSha256 / content_sha256');
}

console.log('ADR-024 evidence ingestion checks passed.');
