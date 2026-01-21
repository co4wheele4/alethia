/**
 * GraphQL Query definitions
 */

import { gql } from '@apollo/client';

export {
  CHUNKS_BY_DOCUMENT_QUERY,
  CREATE_CHUNK_MUTATION,
  CREATE_DOCUMENT_MUTATION,
  DELETE_DOCUMENT_MUTATION,
  DOCUMENTS_BY_USER_QUERY,
  DOCUMENT_QUERY,
} from '../../features/documents/graphql';

export {
  LOGIN_MUTATION,
  REGISTER_MUTATION,
  CHANGE_PASSWORD_MUTATION,
  FORGOT_PASSWORD_MUTATION,
} from '../../features/auth/graphql';

// Example: Hello query
export const HELLO_QUERY = gql`
  query Hello {
    hello
  }
`;
