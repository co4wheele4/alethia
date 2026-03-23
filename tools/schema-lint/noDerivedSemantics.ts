/**
 * ADR-022: Query Non-Semantic Constraint — Schema Lint
 *
 * Scans GraphQL schema AST and fails on:
 * - Fields matching forbidden derived-semantic patterns
 * - Query type containing orderBy, sort, or compare* arguments
 *
 * Epistemic rule: Queries MUST be structural only. No inference, scoring, or ranking.
 */

import {
  parse,
  visit,
  type DocumentNode,
  type ObjectTypeDefinitionNode,
  type InputObjectTypeDefinitionNode,
  type FieldDefinitionNode,
  type InputValueDefinitionNode,
} from 'graphql';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

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

function matchesAny(name: string, patterns: RegExp[]): boolean {
  return patterns.some((re) => re.test(name));
}

/**
 * Validates schema SDL document. Throws if any violation is found.
 */
export function validateSchema(document: DocumentNode): void {
  const errors: string[] = [];

  visit(document, {
    ObjectTypeDefinition(node: ObjectTypeDefinitionNode) {
      const typeName = node.name?.value ?? '';
      const fields = node.fields ?? [];

      for (const field of fields) {
        const fieldName = field.name?.value ?? '';
        if (matchesAny(fieldName, FORBIDDEN_FIELD_PATTERNS)) {
          errors.push(
            `ADR-022: Forbidden derived-semantic field "${typeName}.${fieldName}" (matches /score|confidence|rank|relevance|similar|related|summary|aggregate/i)`,
          );
        }

        if (typeName === 'Query') {
          const args = field.arguments ?? [];
          for (const arg of args) {
            const argName = arg.name?.value ?? '';
            if (matchesAny(argName, FORBIDDEN_QUERY_ARG_PATTERNS)) {
              errors.push(
                `ADR-022: Query field "${fieldName}" has forbidden argument "${argName}" (orderBy|sort|compare* are prohibited)`,
              );
            }
          }
        }
      }
    },
    InputObjectTypeDefinition(node: InputObjectTypeDefinitionNode) {
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
    throw new Error(
      `ADR-022 schema violations:\n${errors.map((e) => `  - ${e}`).join('\n')}`,
    );
  }
}

/**
 * Load schema from file path and validate. Exits process with code 1 on failure.
 */
export function runFromFile(schemaPath: string): void {
  const absPath = resolve(process.cwd(), schemaPath);
  const sdl = readFileSync(absPath, 'utf8');
  const document = parse(sdl);

  try {
    validateSchema(document);
    console.log('ADR-022: Schema validation passed (no derived-semantic fields).');
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}
