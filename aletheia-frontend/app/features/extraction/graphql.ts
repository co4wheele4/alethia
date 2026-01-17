import { gql } from '@apollo/client';

export const PROPOSE_EXTRACTION_MUTATION = gql`
  mutation ProposeExtraction($chunkId: ID!) {
    proposeExtraction(chunkId: $chunkId) {
      __typename
      id
      kind
      status
      entityName
      entityType
      subjectName
      subjectType
      objectName
      objectType
      relation
      startOffset
      endOffset
      excerpt
    }
  }
`;

export const ACCEPT_SUGGESTION_MUTATION = gql`
  mutation AcceptSuggestion($id: ID!) {
    acceptSuggestion(id: $id) {
      __typename
      id
      status
    }
  }
`;

export const REJECT_SUGGESTION_MUTATION = gql`
  mutation RejectSuggestion($id: ID!) {
    rejectSuggestion(id: $id) {
      __typename
      id
      status
    }
  }
`;
