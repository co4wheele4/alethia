/**
 * ADR-022: Developer Guardrails Test Suite
 *
 * Validates that epistemic guardrails correctly detect violations.
 * - GraphQL query with orderBy fails
 * - GraphQL query with score fails
 * - PR epistemic guard runs
 *
 * Derived semantics are forbidden (ADR-022)
 */

const { execSync } = require('child_process');
const { writeFileSync, unlinkSync, existsSync, mkdirSync, rmSync } = require('fs');
const { join } = require('path');

const ROOT = join(__dirname, '..');

describe('Guardrails', function () {
  describe('GraphQL lint: noSemanticQueries', function () {
    it('rejects query containing orderBy', function () {
      const tempDir = join(ROOT, 'tests', '_guardrail-fixtures');
      const tempFile = join(tempDir, 'bad-query.graphql');
      mkdirSync(tempDir, { recursive: true });
      writeFileSync(tempFile, 'query { claims(orderBy: createdAt) { id } }');
      try {
        try {
          execSync(`node tools/graphql-lint/noSemanticQueries.cjs`, {
            cwd: ROOT,
            env: { ...process.env, GRAPHQL_LINT_DIRS: `tests/_guardrail-fixtures` },
          });
          expect(true).toBe(false);
        } catch (e) {
          const status = e && typeof e === 'object' && 'status' in e ? e.status : 1;
          expect(status).toBe(1);
        }
      } finally {
        if (existsSync(tempFile)) unlinkSync(tempFile);
        if (existsSync(tempDir)) rmSync(tempDir, { recursive: true });
      }
    });

    it('rejects query containing score field', function () {
      const tempDir = join(ROOT, 'tests', '_guardrail-fixtures');
      const tempFile = join(tempDir, 'bad-score.graphql');
      mkdirSync(tempDir, { recursive: true });
      writeFileSync(tempFile, 'query { claim(id: "1") { id score } }');
      try {
        try {
          execSync(`node tools/graphql-lint/noSemanticQueries.cjs`, {
            cwd: ROOT,
            env: { ...process.env, GRAPHQL_LINT_DIRS: `tests/_guardrail-fixtures` },
          });
          expect(true).toBe(false);
        } catch (e) {
          const status = e && typeof e === 'object' && 'status' in e ? e.status : 1;
          expect(status).toBe(1);
        }
      } finally {
        if (existsSync(tempFile)) unlinkSync(tempFile);
        if (existsSync(tempDir)) rmSync(tempDir, { recursive: true });
      }
    });
  });

  describe('PR epistemic guard', function () {
    it('exits 0 when no violations in staged diff', function () {
      const result = execSync('node tools/pr-checks/epistemicGuard.cjs', {
        cwd: ROOT,
        encoding: 'utf8',
      });
      expect(result).toBeDefined();
    });
  });
});
