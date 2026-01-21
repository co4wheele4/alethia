import { gql } from '@apollo/client';

import { DOCUMENT_FRAGMENT } from '../fragments/document.fragment';

/**
 * List documents for browsing provenance (read-only).
 *
 * NOTE: Uses `documents` (no auth/user parameter) to keep the contract minimal.
 * If the backend requires auth, Apollo's auth link still attaches the token.
 */
export const LIST_DOCUMENTS_QUERY = gql`
  query ListDocuments {
    documents {
      ...DocumentFragment
      chunks {
        __typename
        id
      }
    }
  }
  ${DOCUMENT_FRAGMENT}
`;

