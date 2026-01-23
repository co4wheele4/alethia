import { gql } from '@apollo/client';

import { CLAIM_FIELDS } from '../fragments/claim.fragment';

export const LIST_CLAIMS_QUERY = gql`
  query ListClaims {
    claims {
      ...ClaimFields
    }
  }
  ${CLAIM_FIELDS}
`;

