import { gql } from '@apollo/client';

import { CLAIM_FIELDS } from '../fragments/claim.fragment';

/** ADR-033: Non-semantic claim search (deterministic order; explicit pagination). */
export const SEARCH_CLAIMS_QUERY = gql`
  query SearchClaims($input: SearchClaimsInput!) {
    searchClaims(input: $input) {
      ...ClaimFields
    }
  }
  ${CLAIM_FIELDS}
`;
