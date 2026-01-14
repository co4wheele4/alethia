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

// Example: Hello query
export const HELLO_QUERY = gql`
  query Hello {
    hello
  }
`;

// Login mutation
export const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password)
  }
`;

// Register mutation
export const REGISTER_MUTATION = gql`
  mutation Register($email: String!, $password: String!, $name: String) {
    register(email: $email, password: $password, name: $name)
  }
`;

// Change password mutation
export const CHANGE_PASSWORD_MUTATION = gql`
  mutation ChangePassword($currentPassword: String!, $newPassword: String!) {
    changePassword(currentPassword: $currentPassword, newPassword: $newPassword)
  }
`;

// Forgot password mutation (request password reset email)
export const FORGOT_PASSWORD_MUTATION = gql`
  mutation ForgotPassword($email: String!) {
    forgotPassword(email: $email)
  }
`;