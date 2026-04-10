// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import aletheiaPlugin from 'eslint-plugin-aletheia';

const aletheia = aletheiaPlugin?.default ?? aletheiaPlugin;

export default tseslint.config(
  {
    ignores: [
      'eslint.config.mjs',
      // Local ADR-032 scratch files may appear from tooling; not part of the tracked contract yet.
      'src/ingestion/htmlCrawlRunner.ts',
      'src/ingestion/htmlCrawlRunner.spec.ts',
      'src/ingestion/html-crawl-ingestion.service.ts',
      'src/graphql/resolvers/html-crawl-ingestion.resolver.ts',
      'src/graphql/inputs/html-crawl-ingestion.input.ts',
      'src/graphql/models/html-crawl-ingestion.model.ts',
      'src/common/utils/evidence-raw-body-hash.ts',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  aletheia?.configs?.recommended ?? {
    plugins: { aletheia },
    rules: {
      'aletheia/no-derived-semantics-identifiers': 'error',
      'aletheia/no-inference-logic': 'error',
      'aletheia/no-evidence-transformation': 'error',
      'aletheia/no-claim-comparison': 'error',
    },
  },
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'error', // Promises must be handled - real bug risk
      '@typescript-eslint/no-unsafe-argument': 'warn', // Prisma types are safe, but TypeScript can't verify
      '@typescript-eslint/no-unsafe-assignment': 'warn', // Prisma types are safe, but TypeScript can't verify
      '@typescript-eslint/no-unsafe-call': 'warn', // Prisma types are safe, but TypeScript can't verify
      '@typescript-eslint/no-unsafe-member-access': 'warn', // Prisma types are safe, but TypeScript can't verify
      '@typescript-eslint/no-unsafe-return': 'warn', // Prisma types are safe, but TypeScript can't verify
      '@typescript-eslint/no-useless-escape': 'off',
      'no-useless-escape': 'off',
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
    },
  },
  {
    files: [
      '**/*.spec.ts',
      '**/*.test.ts',
      '**/*.e2e-spec.ts',
      'test/**/*.ts',
      'test-helpers/**/*.ts',
      'scripts/**/*.ts',
    ],
    rules: {
      'aletheia/no-derived-semantics-identifiers': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      'no-useless-escape': 'off',
      '@typescript-eslint/require-await': 'off',
    },
  },
);
