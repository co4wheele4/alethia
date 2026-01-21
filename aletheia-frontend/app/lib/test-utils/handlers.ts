/**
 * MSW (Mock Service Worker) handlers for API mocking
 * 
 * This file contains request handlers for mocking GraphQL and REST API calls
 * during testing. MSW intercepts network requests at the service worker level,
 * providing realistic API mocking without modifying application code.
 * 
 * Best practices:
 * - Keep handlers close to actual API responses
 * - Use realistic data structures
 * - Handle error cases explicitly
 * - Document handler purposes
 */

import { graphql, HttpResponse } from 'msw';

/**
 * GraphQL handlers
 * These handlers intercept GraphQL requests and return mock responses
 * 
 * MSW intercepts requests at the network level, so handlers match the actual
 * request URL and method. For GraphQL, we use the graphql helper which
 * automatically handles POST requests to the GraphQL endpoint.
 */
export const handlers = [
  // Hello query handler
  graphql.query('Hello', () => {
    return HttpResponse.json({
      data: {
        hello: 'Hello from Aletheia!',
      },
    });
  }),

  // Login mutation handler
  graphql.mutation('Login', async ({ request }) => {
    const body = await request.json() as { variables?: { email?: string; password?: string } } | null;
    if (!body || typeof body !== 'object' || !('variables' in body) || !body.variables) {
      return HttpResponse.json(
        {
          errors: [
            {
              message: 'Invalid request body',
              extensions: {
                code: 'BAD_USER_INPUT',
              },
            },
          ],
        },
        { status: 400 }
      );
    }
    const { email, password } = body.variables;

    // Simulate authentication logic
    if (email === 'test@example.com' && password === 'password123') {
      return HttpResponse.json({
        data: {
          login: 'mock-jwt-token-12345',
        },
      });
    }

    // Return error for invalid credentials
    return HttpResponse.json(
      {
        errors: [
          {
            message: 'Invalid email or password',
            extensions: {
              code: 'UNAUTHENTICATED',
            },
          },
        ],
      },
      { status: 401 }
    );
  }),

  // Register mutation handler
  graphql.mutation('Register', async ({ request }) => {
    const body = await request.json() as { variables?: { email?: string; password?: string; name?: string } } | null;
    if (!body || typeof body !== 'object' || !('variables' in body) || !body.variables) {
      return HttpResponse.json(
        {
          errors: [
            {
              message: 'Invalid request body',
              extensions: {
                code: 'BAD_USER_INPUT',
              },
            },
          ],
        },
        { status: 400 }
      );
    }
    const { email } = body.variables;
    // password and name are available but not used in this mock handler
    // const { email, password, name } = body.variables;

    // Simulate registration logic
    if (email === 'exists@example.com') {
      return HttpResponse.json(
        {
          errors: [
            {
              message: 'Email already exists',
              extensions: {
                code: 'BAD_USER_INPUT',
              },
            },
          ],
        },
        { status: 400 }
      );
    }

    // Successful registration
    return HttpResponse.json({
      data: {
        register: 'mock-jwt-token-new-user',
      },
    });
  }),

  // Change password mutation handler
  graphql.mutation('ChangePassword', async ({ request }) => {
    const body = await request.json() as { variables?: { currentPassword?: string; newPassword?: string } } | null;
    if (!body || typeof body !== 'object' || !('variables' in body) || !body.variables) {
      return HttpResponse.json(
        {
          errors: [
            {
              message: 'Invalid request body',
              extensions: {
                code: 'BAD_USER_INPUT',
              },
            },
          ],
        },
        { status: 400 }
      );
    }
    const { currentPassword } = body.variables;
    // newPassword is available but not used in this mock handler
    // const { currentPassword, newPassword } = body.variables;

    // Simulate password change logic
    if (currentPassword === 'wrong-password') {
      return HttpResponse.json(
        {
          errors: [
            {
              message: 'Current password is incorrect',
              extensions: {
                code: 'UNAUTHENTICATED',
              },
            },
          ],
        },
        { status: 401 }
      );
    }

    // Successful password change
    return HttpResponse.json({
      data: {
        changePassword: true,
      },
    });
  }),

  // Forgot password mutation handler
  graphql.mutation('ForgotPassword', async ({ request }) => {
    const body = await request.json() as { variables?: { email?: string } } | null;
    if (!body || typeof body !== 'object' || !('variables' in body) || !body.variables) {
      return HttpResponse.json(
        {
          errors: [
            {
              message: 'Invalid request body',
              extensions: {
                code: 'BAD_USER_INPUT',
              },
            },
          ],
        },
        { status: 400 }
      );
    }
    const { email } = body.variables;

    // Simulate forgot password logic
    if (email === 'notfound@example.com') {
      return HttpResponse.json(
        {
          errors: [
            {
              message: 'No account found with this email address',
              extensions: {
                code: 'NOT_FOUND',
              },
            },
          ],
        },
        { status: 404 }
      );
    }

    // Successful password reset email sent
    return HttpResponse.json({
      data: {
        forgotPassword: true,
      },
    });
  }),
];
