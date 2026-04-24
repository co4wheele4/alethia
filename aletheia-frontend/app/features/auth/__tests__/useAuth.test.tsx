import type { ReactNode } from 'react'

import { ApolloClient, ApolloLink, InMemoryCache } from '@apollo/client'
import { ApolloProvider } from '@apollo/client/react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { Observable } from 'rxjs'

import { useAuth } from '../hooks/useAuth'
import * as authUtils from '../utils/auth'

vi.mock('../utils/auth', () => ({
  getAuthToken: vi.fn(() => null),
  removeAuthToken: vi.fn(),
  setAuthToken: vi.fn(),
}))

type MockOperationResult =
  | { data: Record<string, unknown> }
  | { error: unknown }

function createMockClient(
  resolveOperation: (operationName: string) => MockOperationResult,
) {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: new ApolloLink((operation) => {
      return new Observable((observer) => {
        const result = resolveOperation(
          String(operation.operationName ?? ''),
        )
        if ('error' in result) {
          observer.error(result.error)
          return
        }
        observer.next({ data: result.data } as any)
        observer.complete()
      })
    }),
  })
}

function createWrapper(client: ApolloClient) {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <ApolloProvider client={client}>{children}</ApolloProvider>
  )
  Wrapper.displayName = 'UseAuthTestWrapper'
  return Wrapper
}

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
    ;(authUtils.getAuthToken as ReturnType<typeof vi.fn>).mockReturnValue(null)
    localStorage.clear()
  })

  it('hydrates an existing auth token from storage on mount', async () => {
    ;(authUtils.getAuthToken as ReturnType<typeof vi.fn>).mockReturnValue(
      'stored-token',
    )
    const client = createMockClient(() => ({ data: {} }))

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(client),
    })

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true)
    })

    expect(result.current.token).toBe('stored-token')
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('preserves a successful login token when initialization completes afterwards', async () => {
    const client = createMockClient((operationName) => {
      if (operationName === 'Login') {
        return { data: { login: 'login-token' } }
      }
      return { data: {} }
    })

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(client),
    })

    await act(async () => {
      await expect(
        result.current.login('test@example.com', 'Password123!'),
      ).resolves.toBe('login-token')
    })

    expect(authUtils.setAuthToken).toHaveBeenCalledWith('login-token')
    expect(result.current.token).toBe('login-token')
    expect(result.current.isAuthenticated).toBe(true)

    // isInitialized is set in requestAnimationFrame (see useAuth), not timers
    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true)
    })
  })

  it('stores the JWT returned by registration and authenticates the user', async () => {
    const client = createMockClient((operationName) => {
      if (operationName === 'Register') {
        return { data: { register: 'register-token' } }
      }
      return { data: {} }
    })

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(client),
    })

    await act(async () => {
      await expect(
        result.current.register('new@example.com', 'ValidPass123!', 'New User'),
      ).resolves.toBe('register-token')
    })

    expect(authUtils.setAuthToken).toHaveBeenCalledWith('register-token')
    expect(result.current.token).toBe('register-token')
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('returns success from changePassword without disturbing the current auth token', async () => {
    ;(authUtils.getAuthToken as ReturnType<typeof vi.fn>).mockReturnValue(
      'existing-token',
    )
    const client = createMockClient((operationName) => {
      if (operationName === 'ChangePassword') {
        return { data: { changePassword: true } }
      }
      return { data: {} }
    })

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(client),
    })

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true)
    })

    await act(async () => {
      await expect(
        result.current.changePassword('OldPass123!', 'NewPass123!'),
      ).resolves.toBe(true)
    })

    expect(result.current.token).toBe('existing-token')
    expect(result.current.isAuthenticated).toBe(true)
    expect(authUtils.setAuthToken).not.toHaveBeenCalled()
  })

  it('returns success from forgotPassword without authenticating a logged-out user', async () => {
    const client = createMockClient((operationName) => {
      if (operationName === 'ForgotPassword') {
        return { data: { forgotPassword: true } }
      }
      return { data: {} }
    })

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(client),
    })

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true)
    })

    await act(async () => {
      await expect(
        result.current.forgotPassword('test@example.com'),
      ).resolves.toBe(true)
    })

    expect(result.current.token).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(authUtils.setAuthToken).not.toHaveBeenCalled()
  })

  it('clears the in-memory session and persisted token on logout', async () => {
    ;(authUtils.getAuthToken as ReturnType<typeof vi.fn>).mockReturnValue(
      'stored-token',
    )
    const client = createMockClient(() => ({ data: {} }))

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(client),
    })

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true)
    })

    act(() => {
      result.current.logout()
    })

    expect(authUtils.removeAuthToken).toHaveBeenCalledTimes(1)
    expect(result.current.token).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })
})
