#!/usr/bin/env node
/**
 * ADR-022: GraphQL Query Lint — No Semantic Queries
 *
 * Validates .graphql files and gql`` strings.
 * Rejects queries containing forbidden terms: orderBy, sort, rank, score, compare, etc.
 * Also rejects aliases implying ranking: topClaims: claims
 *
 * Derived semantics are forbidden (ADR-022)
 */

const { readFileSync, readdirSync, statSync } = require('node:fs');
const { join, relative } = require('node:path');
const { parse, visit } = require('graphql');

const FORBIDDEN_QUERY_TERMS = [
  'orderBy',
  'sort',
  'rank',
  'score',
  'compare',
  'related',
  'similar',
  'summary',
  'aggregate',
];

const FORBIDDEN_ALIAS_PREFIXES = ['top', 'best', 'strongest', 'weakest', 'ranked', 'sorted'];

function collectGraphQLStrings(dir, baseDir) {
  const results = [];
  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    const relPath = relative(baseDir, fullPath);

    if (entry.isDirectory()) {
      if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
        results.push(...collectGraphQLStrings(fullPath, baseDir));
      }
    } else if (entry.isFile()) {
      if (entry.name.endsWith('.graphql') || entry.name.endsWith('.gql')) {
        results.push({
          path: relPath,
          content: readFileSync(fullPath, 'utf8'),
        });
      } else if (
        /\.(ts|tsx|js|jsx)$/.test(entry.name) &&
        !relPath.includes('node_modules') &&
        !relPath.includes('.next')
      ) {
        const content = readFileSync(fullPath, 'utf8');
        const matches = [...content.matchAll(/gql`([^`]*(?:\\.[^`]*)*)`/gs)];
        for (const m of matches) {
          if (m[1]) {
            results.push({
              path: `${relPath} (gql template)`,
              content: m[1].replace(/\\`/g, '`'),
            });
          }
        }
      }
    }
  }
  return results;
}

function lintGraphQL(content, path) {
  const errors = [];

  for (const term of FORBIDDEN_QUERY_TERMS) {
    const re = new RegExp(`\\b${term}\\b`, 'gi');
    if (re.test(content)) {
      errors.push(`Forbidden term "${term}" in query (ADR-022)`);
    }
  }

  const aliasRe = /(\w+)\s*:\s*claims\b/gi;
  let m;
  while ((m = aliasRe.exec(content)) !== null) {
    const alias = m[1];
    if (FORBIDDEN_ALIAS_PREFIXES.some((p) => alias.toLowerCase().startsWith(p))) {
      errors.push(`Alias "${alias}" implies ranking (ADR-022)`);
    }
  }

  try {
    const doc = parse(content);
    visit(doc, {
      Field(node) {
        const name = node.alias?.value ?? node.name?.value ?? '';
        const nameLower = name.toLowerCase();
        for (const p of FORBIDDEN_ALIAS_PREFIXES) {
          if (nameLower.startsWith(p)) {
            errors.push(`Alias/field "${name}" implies ranking (ADR-022)`);
          }
        }
        if (FORBIDDEN_QUERY_TERMS.includes(nameLower)) {
          errors.push(`Forbidden field/alias "${name}" (ADR-022)`);
        }
      },
      Argument(node) {
        const name = node.name?.value ?? '';
        if (FORBIDDEN_QUERY_TERMS.some((t) => name.toLowerCase().includes(t))) {
          errors.push(`Forbidden argument "${name}" (ADR-022)`);
        }
      },
    });
  } catch {
    // Parse error - skip AST checks
  }

  return errors;
}

function main() {
  const root = process.cwd();
  const extraDirs = process.env.GRAPHQL_LINT_DIRS ? process.env.GRAPHQL_LINT_DIRS.split(':') : [];
  const searchDirs = [
    join(root, 'aletheia-frontend', 'src'),
    join(root, 'aletheia-frontend', 'app'),
    join(root, 'aletheia-frontend', 'e2e'),
    ...extraDirs.map((d) => (d.startsWith('/') ? d : join(root, d))),
  ].filter((d) => {
    try {
      return statSync(d).isDirectory();
    } catch {
      return false;
    }
  });

  if (searchDirs.length === 0) {
    searchDirs.push(root);
  }

  let hasErrors = false;
  for (const dir of searchDirs) {
    const items = collectGraphQLStrings(dir, root);
    for (const { path: filePath, content } of items) {
      const errors = lintGraphQL(content, filePath);
      if (errors.length > 0) {
        hasErrors = true;
        console.error(`\n${filePath}:`);
        for (const e of errors) {
          console.error(`  - ${e}`);
        }
      }
    }
  }

  if (hasErrors) {
    console.error('\nEPISTEMIC_VIOLATION_DETECTED: GraphQL query contains forbidden semantic terms (ADR-022)');
    return 1;
  }
  return 0;
}

process.exit(main());
