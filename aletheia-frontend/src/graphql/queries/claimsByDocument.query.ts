import { gql } from '@apollo/client';

import { CLAIM_FIELDS } from '../fragments/claim.fragment';

export const CLAIMS_BY_DOCUMENT_QUERY = gql`
  query ClaimsByDocument($documentId: String!) {
    claimsByDocument(documentId: $documentId) {
      ...ClaimFields
    }
  }
  ${CLAIM_FIELDS}
`;

