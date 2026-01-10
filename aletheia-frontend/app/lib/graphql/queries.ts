/**
 * GraphQL Query definitions
 */

import { gql } from '@apollo/client';

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
  mutation Register($email: String!, $name: String) {
    register(email: $email, name: $name)
  }
`;