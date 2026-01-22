import { ApolloLink, gql } from '@apollo/client'
import { execute, type GraphQLRequest } from '@apollo/client'
import { Observable } from '@apollo/client/utilities'
import { vi } from 'vitest'
import { config as rxjsConfig } from 'rxjs'

type ApolloClientModule = typeof import('@apollo/client')

async function createClientWithMockHttpLink(terminalLink: ApolloLink) {
  vi.resetModules()

  vi.doMock('@apollo/client', async () => {
    const actual = await vi.importActual<ApolloClientModule>('@apollo/client')
    return {
      ...actual,
      // Replace the module-scope `httpLink` in `apollo-client.ts` with a controllable terminal link.
      createHttpLink: () => terminalLink,
    }
  })

  // Keep auth deterministic for these tests.
  vi.doMock('../../features/auth/utils/auth', () => ({
    getAuthToken: vi.fn(() => null),
  }))

  const { createApolloClient } = await import('../apollo-client')
  return createApolloClient()
}

describe('apollo-client GraphQL contract enforcement (no confidence)', () => {
  it('throws when a response includes a "confidence" field anywhere in result.data', async () => {
    const prevUnhandled = rxjsConfig.onUnhandledError
    const unhandled: unknown[] = []
    rxjsConfig.onUnhandledError = (err) => {
      unhandled.push(err)
    }

    const started = vi.fn()
    const terminalLink = new ApolloLink(() => {
      return new Observable((observer) => {
        started()
        observer.next({
          data: {
            items: [{ id: 'x1', confidence: 0.5 }],
          },
        })
        observer.complete()
      })
    })

    const client = await createClientWithMockHttpLink(terminalLink)

    try {
      // Trigger the link chain; the thrown contract error is reported via RxJS's unhandled error hook.
      const op: GraphQLRequest = { query: gql`query ContractTest { __typename }` }
      const sub = execute(client.link, op, { client }).subscribe({ next: () => {}, error: () => {}, complete: () => {} })

      // Let the link emit, then let RxJS flush its unhandled error callback.
      await new Promise<void>((resolve) => setTimeout(resolve, 0))
      sub.unsubscribe()
      await new Promise<void>((resolve) => setTimeout(resolve, 0))

      expect(started).toHaveBeenCalledTimes(1)
      const msg = unhandled.map((e) => String((e as { message?: unknown } | null | undefined)?.message ?? e)).join('\n')
      expect(msg).toMatch(/Unexpected field "confidence"/i)
      expect(msg).toMatch(/result\.data/i)
    } finally {
      rxjsConfig.onUnhandledError = prevUnhandled
    }
  })

  it('handles repeated object references without infinite recursion (seen-set guard)', async () => {
    const shared: Record<string, unknown> = {}
    const terminalLink = new ApolloLink(() => {
      return new Observable((observer) => {
        observer.next({
          data: {
            a: shared,
            b: shared,
            c: ['ok', 1, null],
          },
        })
        observer.complete()
      })
    })

    const client = await createClientWithMockHttpLink(terminalLink)

    const result = await client.query({
      query: gql`query NoConfidenceOK { __typename }`,
      fetchPolicy: 'no-cache',
    })

    expect(result.data).toBeDefined()
  })

  it('unsubscribes underlying link subscription (noConfidenceLink cleanup)', async () => {
    const innerCleanup = vi.fn()
    const started = vi.fn()
    const terminalLink = new ApolloLink(() => {
      return new Observable(() => {
        started()
        return () => {
          innerCleanup()
        }
      })
    })

    const client = await createClientWithMockHttpLink(terminalLink)

    const op: GraphQLRequest = { query: gql`query UnsubTest { __typename }` }
    const sub = execute(client.link, op, { client }).subscribe({ next: () => {}, error: () => {}, complete: () => {} })
    // Let the link chain start and create the inner subscription.
    await new Promise<void>((resolve) => setTimeout(resolve, 0))
    sub.unsubscribe()
    await new Promise<void>((resolve) => setTimeout(resolve, 0))

    expect(started).toHaveBeenCalledTimes(1)
    expect(innerCleanup).toHaveBeenCalledTimes(1)
  })

  it('propagates downstream link errors through the noConfidenceLink error path', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const terminalLink = new ApolloLink(() => {
      return new Observable((observer) => {
        observer.error(new Error('terminal boom'))
      })
    })

    const client = await createClientWithMockHttpLink(terminalLink)

    try {
      const op: GraphQLRequest = { query: gql`query ErrorPath { __typename }` }
      await new Promise<void>((resolve, reject) => {
        const sub = execute(client.link, op, { client }).subscribe({
          next: () => reject(new Error('Should not emit next')),
          error: (e) => {
            expect(String((e as Error).message ?? e)).toContain('terminal boom')
            sub.unsubscribe()
            resolve()
          },
          complete: () => reject(new Error('Should not complete successfully')),
        })
      })

      expect(consoleErrorSpy).toHaveBeenCalled()
      const printed = consoleErrorSpy.mock.calls.map((c) => c.map(String).join(' ')).join('\n')
      expect(printed).toMatch(/\[Network error\]/)
    } finally {
      consoleErrorSpy.mockRestore()
    }
  })
})

