import '@testing-library/jest-dom'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

/* ------------------------------------------------------------------
 * Test lifecycle hygiene
 * ------------------------------------------------------------------ */

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

/* ------------------------------------------------------------------
 * Node / Web API polyfills required by MSW
 * ------------------------------------------------------------------ */

import { TextEncoder, TextDecoder } from 'util'

// whatwg-fetch provides runtime fetch, but typings are imperfect.
// We explicitly bind globals instead of suppressing TS globally.
import 'whatwg-fetch'

Object.assign(globalThis, {
  TextEncoder,
  TextDecoder,
})

/**
 * Enforce correctness: if streaming APIs are required,
 * tests must provide a real polyfill instead of silently succeeding.
 */
if (typeof globalThis.TransformStream === 'undefined') {
  throw new Error(
    'TransformStream is required by MSW streaming. ' +
      'Provide a proper polyfill (e.g. web-streams-polyfill) or disable streaming tests.'
  )
}

if (typeof globalThis.BroadcastChannel === 'undefined') {
  class StrictBroadcastChannel {
    readonly name: string
    onmessage: ((this: BroadcastChannel, ev: MessageEvent) => void) | null = null

    constructor(name: string) {
      this.name = name
    }

    postMessage = vi.fn()
    close = vi.fn()
    addEventListener = vi.fn()
    removeEventListener = vi.fn()
    dispatchEvent = vi.fn(() => false)
  }

  // Explicitly attach
  ;(globalThis as unknown as { BroadcastChannel: typeof BroadcastChannel }).BroadcastChannel =
    StrictBroadcastChannel as unknown as typeof BroadcastChannel
}

/* ------------------------------------------------------------------
 * Next.js App Router mocks (complete, strict)
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

if (typeof window !== 'undefined') {
  // requestAnimationFrame / cancelAnimationFrame (some components rely on these)
  if (typeof window.requestAnimationFrame !== 'function') {
    window.requestAnimationFrame = (cb: FrameRequestCallback) =>
      window.setTimeout(() => cb(Date.now()), 0) as unknown as number
  }
  if (typeof window.cancelAnimationFrame !== 'function') {
    window.cancelAnimationFrame = (id: number) => window.clearTimeout(id)
  }

  if (typeof globalThis.requestAnimationFrame !== 'function') {
    globalThis.requestAnimationFrame = window.requestAnimationFrame.bind(window)
  }
  if (typeof globalThis.cancelAnimationFrame !== 'function') {
    globalThis.cancelAnimationFrame = window.cancelAnimationFrame.bind(window)
  }

  // matchMedia (theme hooks/components often assume it exists)
  if (typeof window.matchMedia !== 'function') {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string): MediaQueryList =>
        ({
          matches: false,
          media: query,
          onchange: null,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          addListener: vi.fn(), // legacy
          removeListener: vi.fn(), // legacy
          dispatchEvent: vi.fn(),
        }) as unknown as MediaQueryList,
    })
  }

  // crypto.subtle.digest (sha-256 helpers + tests expect deterministic output)
  const cryptoMock = {
    subtle: { digest: vi.fn().mockResolvedValue(new ArrayBuffer(32)) },
    randomUUID: () => 'test-uuid',
  } as unknown as Crypto

  const installCrypto = (target: typeof globalThis) => {
    const desc = Object.getOwnPropertyDescriptor(target, 'crypto')
    if (!desc || desc.configurable) {
      Object.defineProperty(target, 'crypto', { value: cryptoMock, configurable: true })
      return
    }

    if (desc.writable) {
      ;(target as unknown as { crypto: Crypto }).crypto = cryptoMock
      return
    }

    throw new Error('Test environment requires writable global crypto for sha256 mocks.')
  }

  installCrypto(globalThis)
  installCrypto(window as unknown as typeof globalThis)
}
