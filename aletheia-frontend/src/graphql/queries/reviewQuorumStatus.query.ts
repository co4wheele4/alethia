import { gql } from '@apollo/client';

export const REVIEW_QUORUM_STATUS_QUERY = gql`
  query ReviewQuorumStatus($claimId: ID!) {
    reviewQuorumStatus(claimId: $claimId) {
      enabled
      requiredCount
      acknowledgedCount
    }
  }
`;
