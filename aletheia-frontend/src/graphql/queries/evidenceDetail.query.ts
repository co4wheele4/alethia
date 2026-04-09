import { gql } from '@apollo/client';

export const GET_EVIDENCE_DETAIL_QUERY = gql`
  query GetEvidenceDetail($id: String!) {
    evidenceById(id: $id) {
      __typename
      id
      createdAt
      sourceType
      sourceUrl
      snippet
      contentSha256
    }
    evidenceReproChecks(evidenceId: $id) {
      id
      checkedAt
      fetchStatus
      hashMatch
      fetchedHash
      errorMessage
    }
  }
`;
