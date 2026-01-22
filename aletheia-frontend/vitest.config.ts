import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import path from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)

// Resolve React from root node_modules or local node_modules
let reactPath, reactDomPath
try {
  reactPath = path.dirname(require.resolve('react', { paths: [path.join(__dirname, 'node_modules')] }))
} catch {
  reactPath = path.dirname(require.resolve('react', { paths: [path.join(__dirname, '..', 'node_modules')] }))
}

try {
  reactDomPath = path.dirname(require.resolve('react-dom', { paths: [path.join(__dirname, 'node_modules')] }))
} catch {
  reactDomPath = path.dirname(require.resolve('react-dom', { paths: [path.join(__dirname, '..', 'node_modules')] }))
}

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
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
      ],
      thresholds: {
        global: {
          branches: 100,
          functions: 100,
          lines: 100,
          statements: 100,
        },
      },
    },
  },
  resolve: {
    alias: {
      'react': reactPath,
      'react-dom': reactDomPath,
      'react-dom/client': path.join(reactDomPath, 'client.js'),
      'react/jsx-runtime': path.join(reactPath, 'jsx-runtime.js'),
    },
  },
})
