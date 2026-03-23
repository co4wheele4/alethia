/* eslint-disable no-console */
/**
 * ADR-022: Query Non-Semantic Constraint — Schema Lint
 *
 * Scans GraphQL schema and fails on forbidden derived-semantic fields/args.
 * Run via: npm run schema:lint --workspace=aletheia-backend
 */
const fs = require('node:fs');
const path = require('node:path');
const { parse, visit } = require('graphql');

const FORBIDDEN_FIELD_PATTERNS = [
  /score/i,
  /confidence/i,
  /rank/i,
  /relevance/i,
  /similar/i,
  /related/i,
  /summary/i,
  /aggregate/i,
];

const FORBIDDEN_QUERY_ARG_PATTERNS = [/^orderBy$/i, /^sort$/i, /^compare/i];

function matchesAny(name, patterns) {
  return patterns.some((re) => re.test(name));
}

function main() {
  const schemaPath = path.resolve(__dirname, '../src/schema.gql');
  const sdl = fs.readFileSync(schemaPath, 'utf8');
  const document = parse(sdl);
  const errors = [];

  visit(document, {
    ObjectTypeDefinition(node) {
      const typeName = node.name?.value ?? '';
      const fields = node.fields ?? [];

      for (const field of fields) {
        const fieldName = field.name?.value ?? '';
        if (matchesAny(fieldName, FORBIDDEN_FIELD_PATTERNS)) {
          errors.push(
            `ADR-022: Forbidden derived-semantic field "${typeName}.${fieldName}"`,
          );
        }
        if (typeName === 'Query') {
          const args = field.arguments ?? [];
          for (const arg of args) {
            const argName = arg.name?.value ?? '';
            if (matchesAny(argName, FORBIDDEN_QUERY_ARG_PATTERNS)) {
              errors.push(
                `ADR-022: Query field "${fieldName}" has forbidden argument "${argName}"`,
              );
            }
          }
        }
      }
    },
    InputObjectTypeDefinition(node) {
      const typeName = node.name?.value ?? '';
      const fields = node.fields ?? [];
      for (const field of fields) {
        const fieldName = field.name?.value ?? '';
        if (matchesAny(fieldName, FORBIDDEN_FIELD_PATTERNS)) {
          errors.push(
            `ADR-022: Forbidden derived-semantic input field "${typeName}.${fieldName}"`,
          );
        }
      }
    },
  });

  if (errors.length > 0) {
    console.error('ADR-022 schema violations:');
    errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }

  console.log('ADR-022: Schema validation passed (no derived-semantic fields).');
}

main();
