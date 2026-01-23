import type { RequestHandler } from 'msw';

import { authHandlers } from './auth.handlers';
import { claimHandlers } from './claims.handlers';
import { documentHandlers } from './documents.handlers';
import { entityHandlers } from './entities.handlers';
import { relationshipHandlers } from './relationships.handlers';
import { fixture } from '@/src/mocks/aletheia-fixtures';
import { assertNoConfidence } from '@/src/test/msw/assertNoConfidence';

/**
 * Single source of truth for MSW handlers.
 *
 * IMPORTANT:
 * - GraphQL confidence/probability fields are forbidden by the authoritative schema.
 * - Each GraphQL handler must deep-scan its response and fail loudly if such fields appear.
 */
assertNoConfidence(fixture, 'fixture');

export const handlers: RequestHandler[] = [
  ...documentHandlers,
  ...entityHandlers,
  ...relationshipHandlers,
  ...claimHandlers,
  ...authHandlers,
];

