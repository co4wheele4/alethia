import { gql } from '@apollo/client';

import { CLAIM_FIELDS } from '../fragments/claim.fragment';

export const LIST_CLAIMS_QUERY = gql`
  query ListClaims($filter: ClaimFilterInput, $limit: Int!, $offset: Int!) {
    claims(filter: $filter, limit: $limit, offset: $offset) {
      ...ClaimFields
    }
  }
  ${CLAIM_FIELDS}
`;

