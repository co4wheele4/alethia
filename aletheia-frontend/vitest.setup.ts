/* eslint-disable @typescript-eslint/no-explicit-any */
import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Polyfills for MSW in Node.js environment
// MSW requires these APIs to be available globally
import { TextEncoder, TextDecoder } from 'util'
// @ts-expect-error - whatwg-fetch is not a module but we need its types or it is fine to ignore
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
  globalThis.TransformStream = class TransformStream {
    readable: any
    writable: any
    constructor() {
      this.readable = { getReader: () => ({ read: async () => ({ done: true }) }) }
      this.writable = { getWriter: () => ({ write: async () => {}, close: async () => {} }) }
    }
  } as any
}

// Polyfill for BroadcastChannel (required by MSW)
if (typeof globalThis.BroadcastChannel === 'undefined') {
  globalThis.BroadcastChannel = class BroadcastChannel {
    constructor() {}
    postMessage() {}
    close() {}
    addEventListener() {}
    removeEventListener() {}
  } as any
}

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
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
  let store: Record<string, string> = {}
  return {
    getItem(key: string) {
      return store[key] || null
    },
    setItem(key: string, value: any) {
      store[key] = String(value)
    },
    removeItem(key: string) {
      delete store[key]
    },
    clear() {
      store = {}
    }
  }
})()

// Some tests run under non-jsdom environments; guard window usage.
if (typeof window !== 'undefined') {
  // Ensure RAF APIs exist (some components use them for hydration timing).
  if (typeof window.requestAnimationFrame !== 'function') {
    (window as any).requestAnimationFrame = (cb: any) => setTimeout(() => cb(Date.now()), 0)
  }
  if (typeof window.cancelAnimationFrame !== 'function') {
    (window as any).cancelAnimationFrame = (id: any) => clearTimeout(id)
  }
  if (typeof globalThis.requestAnimationFrame !== 'function') {
    (globalThis as any).requestAnimationFrame = window.requestAnimationFrame
  }
  if (typeof globalThis.cancelAnimationFrame !== 'function') {
    (globalThis as any).cancelAnimationFrame = window.cancelAnimationFrame
  }

  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
  })

  // Mock window.matchMedia for theme hooks
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })

  // Mock crypto for sha256 generation
  Object.defineProperty(window, 'crypto', {
    value: {
      subtle: {
        digest: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
      },
      randomUUID: () => 'test-uuid',
    },
  })
}
