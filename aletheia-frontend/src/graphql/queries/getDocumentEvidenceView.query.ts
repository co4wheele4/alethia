import { gql } from '@apollo/client';

import { DOCUMENT_EVIDENCE_VIEW } from '../fragments/documentEvidenceView.fragment';

/**
 * Truth Surface v1: fetch the evidence surface for a single document.
 *
 * Contract:
 * - Must reuse the prescriptive fragments (ADR-005).
 * - Must not query confidence/probability (ADR-005/006).
 */
export const GET_DOCUMENT_EVIDENCE_VIEW_QUERY = gql`
  query GetDocumentEvidenceView($id: String!) {
    document(id: $id) {
      ...DocumentEvidenceView
    }
  }
  ${DOCUMENT_EVIDENCE_VIEW}
`;

