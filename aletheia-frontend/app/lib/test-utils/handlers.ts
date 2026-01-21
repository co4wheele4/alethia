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

/**
 * MSW handlers (single source of truth).
 *
 * Tests should only ever import handlers from here (or via server/worker),
 * but the implementations live in `src/mocks/handlers.ts` to share with dev.
 */
export { handlers } from '@/src/mocks/handlers';
