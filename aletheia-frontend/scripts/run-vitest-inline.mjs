/**
 * Programmatic Vitest entry used by `npm run test:unit*`.
 * **Keep in sync** with `vitest.config.ts` (include/exclude, coverage rules, `resolve.alias`, `esbuild.jsx`)
 * so CI and ad-hoc `npx vitest` behave the same. Only pool/worker flags are unique here
 * (threads + maxWorkers:1 for Windows coverage stability).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { startVitest } from 'vitest/node'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(scriptDir, '..')

try {
  fs.mkdirSync(path.join(rootDir, 'coverage', '.tmp'), { recursive: true })
} catch {
  // Best-effort: if this fails, Vitest will surface it explicitly.
}

function resolveModuleDir(moduleName) {
  const local = path.join(rootDir, 'node_modules', moduleName)
  if (fs.existsSync(local)) return local
  return path.join(rootDir, '..', 'node_modules', moduleName)
}

const reactPath = resolveModuleDir('react')
const reactDomPath = resolveModuleDir('react-dom')

const [command = 'run', ...rawArgs] = process.argv.slice(2)
const isWatch = command === 'watch'
const coverageEnabled = rawArgs.includes('--coverage')
const filters = rawArgs.filter((arg) => !arg.startsWith('-'))

const options = {
  config: false,
  root: rootDir,
  run: !isWatch,
  watch: isWatch,
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
  pool: 'threads',
  maxWorkers: 1,
  fileParallelism: false,
  coverage: {
    enabled: coverageEnabled,
    provider: 'v8',
    clean: false,
    reporter: ['text', 'lcov', 'html'],
    include: ['app/**/*.{js,jsx,ts,tsx}'],
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
      'app/**/types.ts',
    ],
    thresholds: {
      lines: 82,
      statements: 80,
      branches: 72,
      functions: 84,
    },
  },
}

const viteOverrides = {
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'react',
  },
  resolve: {
    alias: {
      '@': rootDir,
      react: reactPath,
      'react-dom': reactDomPath,
      'react-dom/client': path.join(reactDomPath, 'client.js'),
      'react/jsx-runtime': path.join(reactPath, 'jsx-runtime.js'),
    },
  },
}

const ctx = await startVitest('test', filters, options, viteOverrides)

if (!isWatch) {
  const failedCount = ctx.state.getCountOfFailedTests()
  await ctx.close()
  process.exit(process.exitCode ?? (failedCount > 0 ? 1 : 0))
}
