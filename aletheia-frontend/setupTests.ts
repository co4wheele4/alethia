import '@testing-library/jest-dom'
import { afterAll, afterEach, beforeAll, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import { server } from './app/lib/test-utils/server'
import { mkdirSync } from 'node:fs'
import path from 'node:path'

// Vitest (v8 coverage) writes temp coverage shards under `coverage/.tmp/` while tests run.
// On Windows, this directory may not be created eagerly, which can crash the run with ENOENT.
try {
  mkdirSync(path.join(process.cwd(), 'coverage', '.tmp'), { recursive: true })
} catch {
  // If the environment disallows filesystem writes, coverage will fail anyway; keep test setup stable.
}

/* ------------------------------------------------------------------
 * Test lifecycle hygiene
 * ------------------------------------------------------------------ */

beforeAll(() => {
  // MSW is the source of truth for all tests (no backend required).
  // Fail fast if a test triggers an unhandled network request.
  server.listen({ onUnhandledRequest: 'error' })
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  server.resetHandlers()
})

afterAll(() => {
  server.close()
})

/* ------------------------------------------------------------------
 * Node / Web API polyfills required by MSW
 * ------------------------------------------------------------------ */

import { TextEncoder, TextDecoder } from 'util'
import 'whatwg-fetch'

Object.assign(globalThis, {
  TextEncoder,
  TextDecoder,
})

// Web Streams API: Node 18+ provides this. Provide a minimal fallback for older runtimes.
if (typeof globalThis.TransformStream === 'undefined') {
  class MinimalTransformStream {
    readonly readable: {
      getReader: () => { read: () => Promise<{ done: boolean; value?: unknown }> }
    }
    readonly writable: {
      getWriter: () => { write: () => Promise<void>; close: () => Promise<void> }
    }

    constructor() {
      this.readable = {
        getReader: () => ({
          read: async () => ({ done: true }),
        }),
      }

      this.writable = {
        getWriter: () => ({
          write: async () => {},
          close: async () => {},
        }),
      }
    }
  }

  ;(globalThis as unknown as { TransformStream: typeof TransformStream }).TransformStream =
    MinimalTransformStream as unknown as typeof TransformStream
}

/* ------------------------------------------------------------------
 * BroadcastChannel (strict but observable)
 * ------------------------------------------------------------------ */

if (typeof globalThis.BroadcastChannel === 'undefined') {
  class StrictBroadcastChannel {
    readonly name: string
    onmessage: ((this: BroadcastChannel, ev: MessageEvent) => unknown) | null = null

    constructor(name: string) {
      this.name = name
    }

    postMessage = vi.fn()
    close = vi.fn()
    addEventListener = vi.fn()
    removeEventListener = vi.fn()
    dispatchEvent = vi.fn(() => false)
  }

  ;(globalThis as unknown as {
    BroadcastChannel: typeof BroadcastChannel
  }).BroadcastChannel = StrictBroadcastChannel as unknown as typeof BroadcastChannel
}

/* ------------------------------------------------------------------
 * Next.js App Router mocks (complete)
 * ------------------------------------------------------------------ */

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
  notFound: vi.fn(),
}))

/* ------------------------------------------------------------------
 * jsdom-specific browser APIs
 * ------------------------------------------------------------------ */

type WindowLike = typeof globalThis & {
  window?: Window
}

const globalObj = globalThis as WindowLike

if (typeof globalObj.window !== 'undefined') {
  const win = globalObj.window

  /* -----------------------------
   * requestAnimationFrame
   * ----------------------------- */
  if (typeof win.requestAnimationFrame !== 'function') {
    win.requestAnimationFrame = (cb: FrameRequestCallback): number =>
      win.setTimeout(() => cb(performance.now()), 0)
  }

  if (typeof win.cancelAnimationFrame !== 'function') {
    win.cancelAnimationFrame = (id: number): void => {
      win.clearTimeout(id)
    }
  }

  globalObj.requestAnimationFrame = win.requestAnimationFrame
  globalObj.cancelAnimationFrame = win.cancelAnimationFrame

  /* -----------------------------
   * localStorage (deterministic)
   * ----------------------------- */
  const localStorageStore: Record<string, string> = {}

  Object.defineProperty(win, 'localStorage', {
    value: {
      getItem: (key: string): string | null =>
        Object.prototype.hasOwnProperty.call(localStorageStore, key)
          ? localStorageStore[key]
          : null,
      setItem: (key: string, value: string): void => {
        localStorageStore[key] = value
      },
      removeItem: (key: string): void => {
        delete localStorageStore[key]
      },
      clear: (): void => {
        Object.keys(localStorageStore).forEach(k => delete localStorageStore[k])
      },
    },
  })

  /* -----------------------------
   * matchMedia (MUI / responsive)
   * ----------------------------- */
  Object.defineProperty(win, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })

  /* -----------------------------
   * crypto (explicit + deterministic)
   * ----------------------------- */
  Object.defineProperty(win, 'crypto', {
    value: {
      subtle: {
        digest: vi.fn(async () => new ArrayBuffer(32)),
      },
      randomUUID: vi.fn(() => 'test-uuid'),
    },
  })
}
