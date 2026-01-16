/* eslint-disable @typescript-eslint/no-require-imports */
// Jest config files typically use CommonJS require()
const nextJest = require('next/jest')
const path = require('path')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Resolve React from root node_modules (where it's hoisted)
let reactPath, reactDomPath
try {
  reactPath = require.resolve('react', { paths: [path.join(__dirname, 'node_modules')] })
} catch {
  reactPath = require.resolve('react', { paths: [path.join(__dirname, '..', 'node_modules')] })
}

try {
  reactDomPath = require.resolve('react-dom', { paths: [path.join(__dirname, 'node_modules')] })
} catch {
  reactDomPath = require.resolve('react-dom', { paths: [path.join(__dirname, '..', 'node_modules')] })
}

// Normalize paths for Jest (use forward slashes)
const normalizePath = (p) => p.replace(/\\/g, '/')

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^react$': normalizePath(reactPath),
    '^react-dom$': normalizePath(reactDomPath),
    '^react-dom/(.*)$': normalizePath(path.dirname(reactDomPath)) + '/$1',
    '^react/jsx-runtime$': normalizePath(path.dirname(reactPath)) + '/jsx-runtime',
  },
  collectCoverageFrom: [
    // Focus unit coverage on code intended for unit testing.
    // Feature-level pages/workspaces are exercised by Playwright e2e instead.
    'app/components/**/*.{js,jsx,ts,tsx}',
    'app/hooks/**/*.{js,jsx,ts,tsx}',
    'app/services/**/*.{js,jsx,ts,tsx}',
    'app/lib/**/*.{js,jsx,ts,tsx}',
    '!app/**/*.d.ts',
    '!app/**/layout.tsx',
    '!app/**/page.tsx',
    '!app/**/*.stories.{js,jsx,ts,tsx}',
    '!app/**/__tests__/**',
    '!app/providers/**',
    '!app/features/**',
    '!app/error.tsx',
    '!app/not-found.tsx',
  ],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
  // Configure coverage ignore patterns
  coverageProvider: 'v8',
  coverageReporters: ['text', 'lcov', 'html'],
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  // Exclude MSW mock files and E2E tests from Jest
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/e2e/',
    '/app/__tests__/mocks/',
  ],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
