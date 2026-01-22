import { gql } from '@apollo/client';

/**
 * DocumentCore (read-only) fragment.
 *
 * Contract notes:
 * - The authoritative schema snapshot (`/src/schema.gql`) exposes `Document.sourceType` but does NOT expose confidence.
 * - `__typename` is included for Apollo cache normalization and deterministic tests.
 * - No additional fields may be added without updating MSW contract handlers + tests.
 */
export const DOCUMENT_CORE_FRAGMENT = gql`
  fragment DocumentCore on Document {
    __typename
    id
    title
    sourceType
    createdAt
  }
`;

