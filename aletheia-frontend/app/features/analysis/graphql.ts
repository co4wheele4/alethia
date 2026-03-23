/**
 * Analysis GraphQL operations.
 *
 * IMPORTANT:
 * The backend currently returns AI outputs without evidence linkage/citations.
 * UI must therefore label these outputs as hypotheses and explicitly show
 * that evidence traceability is not available yet.
 */

import { gql } from '@apollo/client';

export const ASK_AI_MUTATION = gql`
  mutation AskAi($userId: String!, $query: String!) {
    askAi(userId: $userId, query: $query) {
      __typename
      id
      answer
      query {
        __typename
        id
        query
        createdAt
      }
    }
  }
`;

export const AI_QUERIES_BY_USER_QUERY = gql`
  query AiQueriesByUser($userId: String!) {
    aiQueriesByUser(userId: $userId) {
      __typename
      id
      query
      createdAt
      results {
        __typename
        id
        answer
      }
    }
  }
`;

