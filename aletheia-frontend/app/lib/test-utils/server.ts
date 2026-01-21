/**
 * MSW server setup for Node.js test environment
 * 
 * This server is used in unit/component tests to intercept network requests.
 * It runs in the Node.js environment and uses the 'http' module to intercept requests.
 */

import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// This configures a request mocking server with the given request handlers.
// These handlers are used for all tests unless overridden in individual test files.
export const server = setupServer(...handlers);
