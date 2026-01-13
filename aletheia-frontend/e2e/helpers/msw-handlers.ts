/**
 * MSW Handlers for Playwright E2E Tests
 * 
 * This file provides Playwright route handlers that mimic MSW handlers
 * for GraphQL API mocking in E2E tests.
 * 
 * Playwright uses route interception instead of service workers,
 * so we convert MSW-style handlers to Playwright route handlers.
 */

import { Route } from '@playwright/test';

/**
 * Setup GraphQL route handlers for Playwright
 * This intercepts GraphQL requests and returns mock responses
 */
export async function setupGraphQLMocks(route: Route) {
  const url = route.request().url();
  
  // Only intercept GraphQL requests
  if (!url.includes('/graphql') || route.request().method() !== 'POST') {
    await route.continue();
    return;
  }

  try {
    // Get the request body
    const body = await route.request().postData();
    
    if (!body) {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          errors: [{ message: 'Invalid request body', extensions: { code: 'BAD_USER_INPUT' } }],
        }),
      });
      return;
    }

    const parsedBody = JSON.parse(body);
    // Extract operation name from query string if not provided
    let operationName = parsedBody.operationName;
    if (!operationName && parsedBody.query) {
      const match = parsedBody.query.match(/(?:query|mutation)\s+(\w+)/);
      operationName = match?.[1];
    }

    // Handle different GraphQL operations
    let response: { status: number; body: unknown };

    switch (operationName) {
      case 'Hello':
        response = {
          status: 200,
          body: {
            data: {
              hello: 'Hello from Aletheia!',
            },
          },
        };
        break;

      case 'Login': {
        const { email, password } = parsedBody.variables || {};
        if (email === 'test@example.com' && password === 'password123') {
          response = {
            status: 200,
            body: {
              data: {
                login: 'mock-jwt-token-12345',
              },
            },
          };
        } else {
          response = {
            status: 401,
            body: {
              errors: [{
                message: 'Invalid email or password',
                extensions: { code: 'UNAUTHENTICATED' },
              }],
            },
          };
        }
        break;
      }

      case 'Register': {
        const { email } = parsedBody.variables || {};
        if (email === 'exists@example.com') {
          response = {
            status: 400,
            body: {
              errors: [{
                message: 'Email already exists',
                extensions: { code: 'BAD_USER_INPUT' },
              }],
            },
          };
        } else {
          response = {
            status: 200,
            body: {
              data: {
                register: 'mock-jwt-token-new-user',
              },
            },
          };
        }
        break;
      }

      case 'ChangePassword': {
        const { currentPassword } = parsedBody.variables || {};
        if (currentPassword === 'wrong-password') {
          response = {
            status: 401,
            body: {
              errors: [{
                message: 'Current password is incorrect',
                extensions: { code: 'UNAUTHENTICATED' },
              }],
            },
          };
        } else {
          response = {
            status: 200,
            body: {
              data: {
                changePassword: true,
              },
            },
          };
        }
        break;
      }

      case 'ForgotPassword': {
        const { email } = parsedBody.variables || {};
        if (email === 'notfound@example.com') {
          response = {
            status: 404,
            body: {
              errors: [{
                message: 'No account found with this email address',
                extensions: { code: 'NOT_FOUND' },
              }],
            },
          };
        } else {
          response = {
            status: 200,
            body: {
              data: {
                forgotPassword: true,
              },
            },
          };
        }
        break;
      }

      default:
        // Unknown operation, continue with actual request
        await route.continue();
        return;
    }

    await route.fulfill({
      status: response.status,
      contentType: 'application/json',
      body: JSON.stringify(response.body),
    });
  } catch (error) {
    // If parsing fails, continue with actual request
    console.error('Error parsing GraphQL request:', error);
    await route.continue();
  }
}
