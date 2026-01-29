/* eslint-disable no-console */
/**
 * P0: Schema drift guard (monorepo).
 *
 * Constraints:
 * - Does not assume backend capabilities beyond the committed schema snapshots.
 * - Fails loudly on any drift between the frontend-authoritative snapshot and backend snapshot.
 *
 * This script is intentionally "dumb": it only compares committed artifacts and enforces that
 * no stray schema snapshots exist in ambiguous locations.
 */
const fs = require('node:fs');
const path = require('node:path');

function normalizeNewlines(text) {
  return text.replace(/\r\n/g, '\n');
}

function readUtf8(p) {
  // Ignore newline-at-EOF drift while staying strict elsewhere.
  return normalizeNewlines(fs.readFileSync(p, 'utf8')).trimEnd();
}

function fail(message) {
  console.error(`SCHEMA_SNAPSHOT_DRIFT: ${message}`);
  process.exitCode = 1;
}

function main() {
  const repoRoot = path.resolve(__dirname, '..');
  const rootSchemaPath = path.join(repoRoot, 'src', 'schema.gql');
  const backendSchemaPath = path.join(
    repoRoot,
    'aletheia-backend',
    'src',
    'schema.gql',
  );

  const ambiguousBackendSchemaPath = path.join(
    repoRoot,
    'aletheia-backend',
    'src',
    'graphql',
    'schema.gql',
  );

  if (!fs.existsSync(rootSchemaPath)) {
    fail(`Missing required schema snapshot at ${rootSchemaPath}`);
    return;
  }
  if (!fs.existsSync(backendSchemaPath)) {
    fail(`Missing required schema snapshot at ${backendSchemaPath}`);
    return;
  }

  // Prevent a second (ambiguous) backend schema snapshot from silently diverging.
  if (fs.existsSync(ambiguousBackendSchemaPath)) {
    fail(
      `Ambiguous backend schema snapshot exists at ${ambiguousBackendSchemaPath}. ` +
        `Delete it; backend schema snapshot must be only at ${backendSchemaPath}.`,
    );
  }

  const rootSchema = readUtf8(rootSchemaPath);
  const backendSchema = readUtf8(backendSchemaPath);

  if (rootSchema !== backendSchema) {
    const rootLen = rootSchema.length;
    const backendLen = backendSchema.length;
    const minLen = Math.min(rootLen, backendLen);

    let firstDiffIdx = -1;
    for (let i = 0; i < minLen; i += 1) {
      if (rootSchema.charCodeAt(i) !== backendSchema.charCodeAt(i)) {
        firstDiffIdx = i;
        break;
      }
    }
    if (firstDiffIdx === -1 && rootLen !== backendLen) firstDiffIdx = minLen;

    const contextStart = Math.max(0, firstDiffIdx - 80);
    const contextEnd = firstDiffIdx + 80;

    const rootContext = rootSchema.slice(contextStart, contextEnd);
    const backendContext = backendSchema.slice(contextStart, contextEnd);

    fail(
      [
        `Root and backend schema snapshots differ.`,
        `- root:   ${rootSchemaPath}`,
        `- backend:${backendSchemaPath}`,
        `First difference at character offset ${firstDiffIdx}.`,
        `--- root context ---`,
        rootContext,
        `--- backend context ---`,
        backendContext,
        `Fix: regenerate backend schema snapshot, then sync root /src/schema.gql to match.`,
      ].join('\n'),
    );
  }

  if (process.exitCode !== 1) {
    // Keep output minimal but explicit.
    console.log('Schema snapshots are consistent.');
  }
}

main();

