import { gql } from '@apollo/client';

import { DOCUMENT_CORE_FRAGMENT } from '../fragments/documentCore.fragment';

/**
 * DocumentsIndex (read-only).
 *
 * IMPORTANT:
 * - Document selection MUST be fragment-based (no inline field selection on Document).
 * - No pagination assumptions: the schema currently exposes `documents: [Document!]!` with no args.
 */
export const DOCUMENTS_INDEX_QUERY = gql`
  query DocumentsIndex {
    documents {
      ...DocumentCore
    }
  }
  ${DOCUMENT_CORE_FRAGMENT}
`;

