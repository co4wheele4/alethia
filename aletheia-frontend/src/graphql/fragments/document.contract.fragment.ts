import { gql } from '@apollo/client';

/**
 * Contract-minimal Document fragment.
 *
 * IMPORTANT:
 * - The authoritative schema snapshot (`/src/schema.gql`) does NOT expose any confidence fields.
 * - This fragment intentionally contains no scoring/probability/confidence properties.
 *
 * Note on `status`:
 * - The current schema does not define `Document.status`, so it MUST NOT be queried.
 */
export const DOCUMENT_CONTRACT_FRAGMENT = gql`
  fragment DocumentContractFragment on Document {
    __typename
    id
    title
    sourceType
    createdAt
  }
`;

