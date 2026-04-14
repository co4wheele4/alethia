/* eslint-disable no-console */
/**
 * ADR-032: HTML crawl ingestion — schema lint (mechanical boundaries only).
 *
 * - HtmlCrawlFollowMode must not declare values other than STRICT_ONLY (new modes need ADR).
 * - HtmlCrawl* types must not introduce ranking/relevance-style fields.
 *
 * Run via: npm run schema:lint --workspace=aletheia-backend
 */
const fs = require('node:fs');
const path = require('node:path');
const { parse, visit, Kind } = require('graphql');

const FOLLOW_MODE_TYPE = 'HtmlCrawlFollowMode';
const ALLOWED_FOLLOW = new Set(['STRICT_ONLY']);

const FORBIDDEN_FIELD = [
  /relevance/i,
  /score/i,
  /rank/i,
  /similarity/i,
  /conflict/i,
  /best/i,
  /top\b/i,
  /recommended/i,
];

function main() {
  const schemaPath = path.resolve(__dirname, '../src/schema.gql');
  const sdl = fs.readFileSync(schemaPath, 'utf8');
  const doc = parse(sdl);
  const errors = [];

  visit(doc, {
    EnumTypeDefinition(node) {
      const name = node.name?.value ?? '';
      if (name !== FOLLOW_MODE_TYPE) return;
      const values = (node.values ?? []).map((v) => v.name.value);
      for (const v of values) {
        if (!ALLOWED_FOLLOW.has(v)) {
          errors.push(
            `ADR-032: ${FOLLOW_MODE_TYPE} must only contain STRICT_ONLY (got "${v}"; new follow modes require ADR).`,
          );
        }
      }
      for (const a of ALLOWED_FOLLOW) {
        if (!values.includes(a)) {
          errors.push(`ADR-032: ${FOLLOW_MODE_TYPE} must include ${a}.`);
        }
      }
    },
    ObjectTypeDefinition(node) {
      const typeName = node.name?.value ?? '';
      if (!/^HtmlCrawl/i.test(typeName)) return;
      for (const field of node.fields ?? []) {
        const fn = field.name?.value ?? '';
        if (FORBIDDEN_FIELD.some((re) => re.test(fn))) {
          errors.push(`ADR-032: Forbidden field "${typeName}.${fn}" (no ranking/relevance semantics).`);
        }
      }
    },
    InputObjectTypeDefinition(node) {
      const typeName = node.name?.value ?? '';
      if (!/^HtmlCrawl/i.test(typeName)) return;
      for (const field of node.fields ?? []) {
        const fn = field.name?.value ?? '';
        if (FORBIDDEN_FIELD.some((re) => re.test(fn))) {
          errors.push(`ADR-032: Forbidden input field "${typeName}.${fn}".`);
        }
      }
    },
  });

  // Ensure crawl types exist if enum exists (lightweight sanity)
  const hasFollowEnum = doc.definitions.some(
    (d) => d.kind === Kind.ENUM_TYPE_DEFINITION && d.name.value === FOLLOW_MODE_TYPE,
  );
  if (!hasFollowEnum) {
    errors.push(`ADR-032: Missing enum ${FOLLOW_MODE_TYPE} in schema.gql.`);
  }

  if (errors.length) {
    for (const e of errors) console.error(e);
    process.exit(1);
  }
  console.log('ADR-032 schema lint: OK');
}

main();
