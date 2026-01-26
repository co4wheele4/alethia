import { graphql, HttpResponse } from 'msw';

import { assertNoConfidence } from '@/src/test/msw/assertNoConfidence';

function base64UrlEncode(input: string): string {
  // Works in both Node (vitest) and the browser (MSW service worker runtime).
  const base64 =
    typeof Buffer !== 'undefined'
      ? Buffer.from(input, 'utf8').toString('base64')
      : btoa(unescape(encodeURIComponent(input)));
  return base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function createMockJwt(payload: Record<string, unknown>): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  // Signature is irrelevant for client-side decoding in tests/dev MSW.
  return `${encodedHeader}.${encodedPayload}.signature`;
}

/**
 * App-level auth handlers used by tests/components.
 *
 * Note: these handlers deliberately do NOT fabricate "confidence" or "probability".
 * Those fields are forbidden by the authoritative GraphQL schema snapshot.
 */
export const authHandlers = [
  graphql.query('Hello', () => {
    const data = {
      hello: 'Hello from Aletheia!',
    };
    assertNoConfidence(data, 'data');
    return HttpResponse.json({
      data: {
        hello: data.hello,
      },
    });
  }),

  graphql.mutation('Login', async ({ request }) => {
    const body = (await request.json()) as { variables?: { email?: string; password?: string } } | null;
    if (!body?.variables) {
      return HttpResponse.json(
        {
          errors: [
            {
              message: 'Invalid request body',
              extensions: { code: 'BAD_USER_INPUT' },
            },
          ],
        },
        { status: 400 }
      );
    }

    const { email, password } = body.variables;
    if (email === 'test@example.com' && password === 'password123') {
      const data = {
        login: createMockJwt({
          sub: 'user-1',
          email: 'test@example.com',
          role: 'USER',
          iat: Math.floor(Date.now() / 1000),
        }),
      };
      assertNoConfidence(data, 'data');
      return HttpResponse.json({ data });
    }

    return HttpResponse.json(
      {
        errors: [
          {
            message: 'Invalid email or password',
            extensions: { code: 'UNAUTHENTICATED' },
          },
        ],
      },
      { status: 401 }
    );
  }),

  graphql.mutation('Register', async ({ request }) => {
    const body = (await request.json()) as { variables?: { email?: string; password?: string; name?: string } } | null;
    if (!body?.variables) {
      return HttpResponse.json(
        {
          errors: [
            {
              message: 'Invalid request body',
              extensions: { code: 'BAD_USER_INPUT' },
            },
          ],
        },
        { status: 400 }
      );
    }

    const { email } = body.variables;
    if (email === 'exists@example.com') {
      return HttpResponse.json(
        {
          errors: [
            {
              message: 'Email already exists',
              extensions: { code: 'BAD_USER_INPUT' },
            },
          ],
        },
        { status: 400 }
      );
    }

    const data = { register: 'mock-jwt-token-new-user' };
    assertNoConfidence(data, 'data');
    return HttpResponse.json({ data });
  }),

  graphql.mutation('ChangePassword', async ({ request }) => {
    const body = (await request.json()) as { variables?: { currentPassword?: string; newPassword?: string } } | null;
    if (!body?.variables) {
      return HttpResponse.json(
        {
          errors: [
            {
              message: 'Invalid request body',
              extensions: { code: 'BAD_USER_INPUT' },
            },
          ],
        },
        { status: 400 }
      );
    }

    const { currentPassword } = body.variables;
    if (currentPassword === 'wrong-password') {
      return HttpResponse.json(
        {
          errors: [
            {
              message: 'Current password is incorrect',
              extensions: { code: 'UNAUTHENTICATED' },
            },
          ],
        },
        { status: 401 }
      );
    }

    const data = { changePassword: true };
    assertNoConfidence(data, 'data');
    return HttpResponse.json({ data });
  }),

  graphql.mutation('ForgotPassword', async ({ request }) => {
    const body = (await request.json()) as { variables?: { email?: string } } | null;
    if (!body?.variables) {
      return HttpResponse.json(
        {
          errors: [
            {
              message: 'Invalid request body',
              extensions: { code: 'BAD_USER_INPUT' },
            },
          ],
        },
        { status: 400 }
      );
    }

    const { email } = body.variables;
    if (email === 'notfound@example.com') {
      return HttpResponse.json(
        {
          errors: [
            {
              message: 'No account found with this email address',
              extensions: { code: 'NOT_FOUND' },
            },
          ],
        },
        { status: 404 }
      );
    }

    const data = { forgotPassword: true };
    assertNoConfidence(data, 'data');
    return HttpResponse.json({ data });
  }),
];

