/* eslint-disable no-console */
/**
 * ADR-025: Agent Role Restrictions — Schema Lint
 *
 * Fails if the GraphQL schema introduces field names that would typically
 * carry agent-generated semantic authority (per ADR-025 § Enforcement).
 * Overlaps with ADR-022 are intentional: ADR-025 errors are explicit for
 * agent-policy audits; ADR-022 remains the broader derived-semantics gate.
 *
 * Run via: npm run schema:lint --workspace=aletheia-backend
 */
const fs = require('node:fs');
const path = require('node:path');
const { parse, visit } = require('graphql');

/**
 * Agent-specific semantic field names (ADR-025).
 * score, confidence, relevance, similarity, summary, etc. are enforced by schema-lint-adr022.cjs.
 */
const ADR025_FORBIDDEN_NAME = [
  /^recommendedDecision$/i,
  /^recommendedVerdict$/i,
  /^agentRecommendation$/i,
  /^aiRecommendation$/i,
];

function matchesForbidden(name) {
  return ADR025_FORBIDDEN_NAME.some((re) => re.test(name));
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
        if (matchesForbidden(fieldName)) {
          errors.push(`ADR-025: Forbidden field "${typeName}.${fieldName}" (no agent semantic fields)`);
        }
      }
    },
    InputObjectTypeDefinition(node) {
      const typeName = node.name?.value ?? '';
      const fields = node.fields ?? [];
      for (const field of fields) {
        const fieldName = field.name?.value ?? '';
        if (matchesForbidden(fieldName)) {
          errors.push(`ADR-025: Forbidden input field "${typeName}.${fieldName}" (no agent semantic fields)`);
        }
      }
    },
    InterfaceTypeDefinition(node) {
      const typeName = node.name?.value ?? '';
      const fields = node.fields ?? [];
      for (const field of fields) {
        const fieldName = field.name?.value ?? '';
        if (matchesForbidden(fieldName)) {
          errors.push(`ADR-025: Forbidden interface field "${typeName}.${fieldName}" (no agent semantic fields)`);
        }
      }
    },
  });

  if (errors.length > 0) {
    console.error('ADR-025 schema violations:');
    errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }

  console.log('ADR-025: Schema validation passed (no agent semantic field names).');
}

main();
