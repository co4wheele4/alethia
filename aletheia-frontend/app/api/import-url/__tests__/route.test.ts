import { EventEmitter } from 'node:events'
import type { IncomingHttpHeaders } from 'node:http'

import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const MAX_BYTES = 5 * 1024 * 1024

type RequestOptionsLike = {
  family?: 4 | 6
  headers?: { Host?: string }
  hostname?: string
  lookup?: (
    hostname: string,
    options: unknown,
    callback: (err: NodeJS.ErrnoException | null, address: string, family: number) => void,
  ) => void
  path?: string
  servername?: string
  signal?: AbortSignal
}

type MockResponsePlan = {
  bodyChunks?: Array<Buffer | string>
  headers?: IncomingHttpHeaders
  statusCode?: number
  waitForAbort?: boolean
}

type MockCall = {
  options: RequestOptionsLike
  plan: MockResponsePlan
  response?: MockIncomingResponse
}

type MockIncomingResponse = EventEmitter & {
  destroy: (error?: Error) => void
  headers: IncomingHttpHeaders
  resume: ReturnType<typeof vi.fn>
  statusCode: number
}

let assertPublicHttpUrlForServerFetchMock: ReturnType<typeof vi.fn>
let resolvePublicHttpFetchTargetMock: ReturnType<typeof vi.fn>
let httpPlans: MockResponsePlan[]
let httpsPlans: MockResponsePlan[]
let httpCalls: MockCall[]
let httpsCalls: MockCall[]

function makeRequest(url: string) {
  return new NextRequest(
    `http://localhost/api/import-url?url=${encodeURIComponent(url)}`,
  )
}

function makeFetchTarget(url: string, address: string, family: 4 | 6) {
  return {
    address,
    family,
    url: new URL(url),
  }
}

function createMockResponse(plan: MockResponsePlan) {
  const response = new EventEmitter() as MockIncomingResponse
  let destroyed = false

  response.headers = plan.headers ?? {}
  response.statusCode = plan.statusCode ?? 200
  response.resume = vi.fn()
  response.destroy = (error?: Error) => {
    destroyed = true
    queueMicrotask(() => {
      response.emit('error', error ?? new Error('Response destroyed'))
    })
  }

  queueMicrotask(() => {
    for (const chunk of plan.bodyChunks ?? []) {
      if (destroyed) return
      response.emit('data', chunk)
    }
    if (!destroyed) {
      response.emit('end')
    }
  })

  return response
}

function createRequestMock(plans: MockResponsePlan[], calls: MockCall[]) {
  return vi.fn(
    (options: RequestOptionsLike, callback: (response: MockIncomingResponse) => void) => {
      const plan = plans.shift()
      if (!plan) {
        throw new Error('Unexpected outbound request in import-url route test')
      }

      const request = new EventEmitter() as EventEmitter & { end: () => void }
      const call: MockCall = { options, plan }
      calls.push(call)

      options.signal?.addEventListener(
        'abort',
        () => {
          const abortError = new Error('aborted')
          abortError.name = 'AbortError'
          request.emit('error', abortError)
        },
        { once: true },
      )

      request.end = () => {
        if (plan.waitForAbort) return
        const response = createMockResponse(plan)
        call.response = response
        callback(response)
      }

      return request
    },
  )
}

async function loadRouteModule() {
  vi.resetModules()

  assertPublicHttpUrlForServerFetchMock = vi.fn()
  resolvePublicHttpFetchTargetMock = vi.fn()
  httpPlans = []
  httpsPlans = []
  httpCalls = []
  httpsCalls = []

  const httpRequestMock = createRequestMock(httpPlans, httpCalls)
  const httpsRequestMock = createRequestMock(httpsPlans, httpsCalls)

  vi.doMock('node:http', async () => {
    const actual = await vi.importActual<typeof import('node:http')>('node:http')
    return {
      ...actual,
      default: {
        ...actual,
        request: httpRequestMock,
      },
      request: httpRequestMock,
    }
  })

  vi.doMock('node:https', async () => {
    const actual = await vi.importActual<typeof import('node:https')>('node:https')
    return {
      ...actual,
      default: {
        ...actual,
        request: httpsRequestMock,
      },
      request: httpsRequestMock,
    }
  })

  vi.doMock('../ssrf-public-url', () => ({
    assertPublicHttpUrlForServerFetch: assertPublicHttpUrlForServerFetchMock,
    resolvePublicHttpFetchTarget: resolvePublicHttpFetchTargetMock,
  }))

  return await import('../route')
}

describe('GET /api/import-url', () => {
  beforeEach(() => {
    vi.stubEnv('URL_IMPORT_DEMO_FALLBACK', '0')
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('pins the outbound HTTPS request to the vetted IP and preserves host routing metadata', async () => {
    const sourceUrl = 'https://source.test/articles?id=42'
    const target = makeFetchTarget(sourceUrl, '93.184.216.34', 4)
    const { GET } = await loadRouteModule()

    assertPublicHttpUrlForServerFetchMock.mockResolvedValue(target.url)
    resolvePublicHttpFetchTargetMock.mockResolvedValue(target)
    httpsPlans.push({
      bodyChunks: ['hello from upstream'],
      headers: { 'content-type': 'text/plain; charset=utf-8' },
      statusCode: 200,
    })

    const response = await GET(makeRequest(sourceUrl))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({
      contentType: 'text/plain; charset=utf-8',
      fetchedUrl: sourceUrl,
      raw: 'hello from upstream',
    })
    expect(resolvePublicHttpFetchTargetMock).toHaveBeenCalledTimes(1)
    expect(String(resolvePublicHttpFetchTargetMock.mock.calls[0]?.[0])).toBe(sourceUrl)

    const call = httpsCalls[0]
    expect(call.options.hostname).toBe('93.184.216.34')
    expect(call.options.path).toBe('/articles?id=42')
    expect(call.options.family).toBe(4)
    expect(call.options.headers?.Host).toBe('source.test')
    expect(call.options.servername).toBe('source.test')

    const lookupResult = await new Promise<{ address: string; family: number }>((resolve) => {
      call.options.lookup?.('ignored-hostname', {}, (_err, address, family) => {
        resolve({ address, family })
      })
    })
    expect(lookupResult).toEqual({ address: '93.184.216.34', family: 4 })
  })

  it('re-validates and re-pins every redirect hop before following it', async () => {
    const firstUrl = 'https://source.test/start'
    const redirectedUrl = 'https://redirected.test/next'
    const { GET } = await loadRouteModule()

    assertPublicHttpUrlForServerFetchMock.mockResolvedValue(new URL(firstUrl))
    resolvePublicHttpFetchTargetMock.mockImplementation(async (input: URL | string) => {
      const asString = String(input)
      if (asString === firstUrl) {
        return makeFetchTarget(firstUrl, '93.184.216.34', 4)
      }
      if (asString === redirectedUrl) {
        return makeFetchTarget(redirectedUrl, '203.0.113.25', 4)
      }
      throw new Error(`Unexpected URL revalidation target: ${asString}`)
    })

    httpsPlans.push({
      headers: { location: redirectedUrl },
      statusCode: 302,
    })
    httpsPlans.push({
      bodyChunks: ['<html>redirected</html>'],
      headers: { 'content-type': 'text/html' },
      statusCode: 200,
    })

    const response = await GET(makeRequest(firstUrl))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.fetchedUrl).toBe(redirectedUrl)
    expect(resolvePublicHttpFetchTargetMock).toHaveBeenCalledTimes(2)
    expect(String(resolvePublicHttpFetchTargetMock.mock.calls[0]?.[0])).toBe(firstUrl)
    expect(String(resolvePublicHttpFetchTargetMock.mock.calls[1]?.[0])).toBe(redirectedUrl)
    expect(httpsCalls).toHaveLength(2)
    expect(httpsCalls[0]?.options.hostname).toBe('93.184.216.34')
    expect(httpsCalls[1]?.options.hostname).toBe('203.0.113.25')
    expect(httpsCalls[1]?.options.headers?.Host).toBe('redirected.test')
    expect(httpsCalls[1]?.options.servername).toBe('redirected.test')
  })

  it('rejects responses whose declared size exceeds the route limit', async () => {
    const sourceUrl = 'https://oversized.test/file'
    const target = makeFetchTarget(sourceUrl, '93.184.216.34', 4)
    const { GET } = await loadRouteModule()

    assertPublicHttpUrlForServerFetchMock.mockResolvedValue(target.url)
    resolvePublicHttpFetchTargetMock.mockResolvedValue(target)
    httpsPlans.push({
      headers: { 'content-length': String(MAX_BYTES + 1) },
      statusCode: 200,
    })

    const response = await GET(makeRequest(sourceUrl))
    const body = await response.json()

    expect(response.status).toBe(413)
    expect(body).toEqual({ error: 'Response too large' })
    expect(httpsCalls[0]?.response?.resume).toHaveBeenCalledTimes(1)
  })

  it('rejects streaming bodies that grow beyond the route limit mid-transfer', async () => {
    const sourceUrl = 'https://streaming.test/file'
    const target = makeFetchTarget(sourceUrl, '93.184.216.34', 4)
    const { GET } = await loadRouteModule()

    assertPublicHttpUrlForServerFetchMock.mockResolvedValue(target.url)
    resolvePublicHttpFetchTargetMock.mockResolvedValue(target)
    httpsPlans.push({
      bodyChunks: [Buffer.alloc(MAX_BYTES), Buffer.from('x')],
      headers: { 'content-type': 'application/octet-stream' },
      statusCode: 200,
    })

    const response = await GET(makeRequest(sourceUrl))
    const body = await response.json()

    expect(response.status).toBe(413)
    expect(body).toEqual({ error: 'Response too large' })
  })

  it('returns a timeout error when the pinned request does not complete before the abort deadline', async () => {
    vi.useFakeTimers()

    const sourceUrl = 'https://timeout.test/file'
    const target = makeFetchTarget(sourceUrl, '93.184.216.34', 4)
    const { GET } = await loadRouteModule()

    assertPublicHttpUrlForServerFetchMock.mockResolvedValue(target.url)
    resolvePublicHttpFetchTargetMock.mockResolvedValue(target)
    httpsPlans.push({ waitForAbort: true })

    const responsePromise = GET(makeRequest(sourceUrl))
    await vi.advanceTimersByTimeAsync(30_000)
    const response = await responsePromise
    const body = await response.json()

    expect(response.status).toBe(502)
    expect(body).toEqual({ error: 'Request timed out' })
  })
})
