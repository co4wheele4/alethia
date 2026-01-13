// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Polyfills for MSW in Node.js environment
// MSW requires these APIs to be available globally
import { TextEncoder, TextDecoder } from 'util'
import { fetch, Headers, Request, Response } from 'whatwg-fetch'

// Set up polyfills before MSW is imported
Object.assign(globalThis, {
  TextEncoder,
  TextDecoder,
  fetch,
  Headers,
  Request,
  Response,
})

// Polyfill for TransformStream (required by MSW)
if (typeof globalThis.TransformStream === 'undefined') {
  // Use a simple polyfill or skip MSW setup
  globalThis.TransformStream = class TransformStream {
    constructor() {
      this.readable = { getReader: () => ({ read: async () => ({ done: true }) }) }
      this.writable = { getWriter: () => ({ write: async () => {}, close: async () => {} }) }
    }
  }
}

// Polyfill for BroadcastChannel (required by MSW)
if (typeof globalThis.BroadcastChannel === 'undefined') {
  globalThis.BroadcastChannel = class BroadcastChannel {
    constructor() {}
    postMessage() {}
    close() {}
    addEventListener() {}
    removeEventListener() {}
  }
}

// Setup MSW (Mock Service Worker) for API mocking
// Note: MSW setup is optional - tests can work with or without it
// Uncomment below to enable MSW for all tests
// import { server } from './app/__tests__/mocks/server'
// beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
// afterEach(() => server.resetHandlers())
// afterAll(() => server.close())

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
    }
  },
  usePathname() {
    return '/'
  },
  useSearchParams() {
    return new URLSearchParams()
  },
}))

// Mock localStorage
const localStorageMock = (function() {
  let store = {}
  return {
    getItem(key) {
      return store[key] || null
    },
    setItem(key, value) {
      store[key] = String(value)
    },
    removeItem(key) {
      delete store[key]
    },
    clear() {
      store = {}
    }
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock window.matchMedia for theme hooks
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})
