/**
 * MSW setup helper for tests
 * 
 * Import this in test files that need MSW instead of setting it up globally.
 * This gives more control and avoids polyfill issues.
 */

import { server } from './server';

export const setupMSW = () => {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'warn' });
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });
};
