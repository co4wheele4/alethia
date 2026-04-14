import { gql } from '@apollo/client';

import { DOCUMENT_CORE_FRAGMENT } from '../fragments/documentCore.fragment';

/**
 * DocumentsIndex (read-only).
 *
 * IMPORTANT:
 * - Document selection MUST be fragment-based (no inline field selection on Document).
 * - Pagination is required (ADR-034): limit + offset.
 */
export const DOCUMENTS_INDEX_QUERY = gql`
  query DocumentsIndex($limit: Int!, $offset: Int!) {
    documents(limit: $limit, offset: $offset) {
      ...DocumentCore
    }
  }
  ${DOCUMENT_CORE_FRAGMENT}
`;

