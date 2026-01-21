/**
 * MSW browser setup for browser-based tests
 * 
 * This setup is used for E2E tests or browser-based testing scenarios.
 * It uses Service Workers to intercept network requests in the browser.
 */

import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

// This configures a request mocking worker with the given request handlers.
// These handlers are used for browser-based tests (e.g., Playwright, Cypress).
export const worker = setupWorker(...handlers);
