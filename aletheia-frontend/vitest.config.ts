/**
 * Vitest + Vite defaults for `npx vitest` and IDE test runners.
 * Keep the **test include/exclude, coverage, resolve.alias, and esbuild.jsx** block aligned with
 * `scripts/run-vitest-inline.mjs` (used by `npm run test:unit*`), which duplicates them so
 * `startVitest` can set Windows-oriented pool options without relying on the config file path.
 */
import { defineConfig } from 'vitest/config'
import path from 'path'
import fs from 'node:fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Coverage reliability (Windows): ensure the target directory exists before the v8 provider writes shards.
try {
  fs.mkdirSync(path.join(__dirname, 'coverage', '.tmp'), { recursive: true })
} catch {
  // Best-effort: if this fails, the test run will surface it explicitly.
}

function resolveModuleDir(moduleName: string) {
  const local = path.join(__dirname, 'node_modules', moduleName)
  if (fs.existsSync(local)) return local
  return path.join(__dirname, '..', 'node_modules', moduleName)
}

const reactPath = resolveModuleDir('react')
const reactDomPath = resolveModuleDir('react-dom')

export default defineConfig({
  // If Vitest logs oxc+esbuild "duplicate" JSX options, oxc wins; both target automatic JSX+React and are equivalent for our tests.
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'react',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./setupTests.ts'],
    include: [
      '**/__tests__/**/*.[jt]s?(x)',
      '**/?(*.)+(spec|test).[jt]s?(x)',
    ],
    exclude: [
      '**/node_modules/**',
      '**/.next/**',
      '**/e2e/**',
      '**/app/__tests__/mocks/**',
      '**/app/lib/test-utils/**',
    ],
    coverage: {
      provider: 'v8',
      // Windows reliability: avoid deleting the coverage directory while workers are writing shards.
      // (CI workspaces are clean; in local runs, stale reports are acceptable.)
      clean: false,
      reporter: ['text', 'lcov', 'html'],
      include: [
        'app/**/*.{js,jsx,ts,tsx}',
      ],
      exclude: [
        'app/**/*.d.ts',
        'app/**/layout.tsx',
        'app/**/page.tsx',
        'app/**/*.stories.{js,jsx,ts,tsx}',
        'app/**/__tests__/**',
        'app/**/test-utils/**',
        'app/**/mocks/**',
        'app/providers/**',
        'app/error.tsx',
        'app/not-found.tsx',
        '**/index.ts',
        // Type-only modules (no runtime); counting them drags global % without signal.
        'app/**/types.ts',
      ],
      // Top-level keys only (Vitest 4). Nested `global: { ... }` is not the global minimum gate.
      thresholds: {
        lines: 82,
        statements: 80,
        branches: 72,
        functions: 84,
      },
    },
  },
  resolve: {
    alias: {
      '@': __dirname,
      'react': reactPath,
      'react-dom': reactDomPath,
      'react-dom/client': path.join(reactDomPath, 'client.js'),
      'react/jsx-runtime': path.join(reactPath, 'jsx-runtime.js'),
    },
  },
})
