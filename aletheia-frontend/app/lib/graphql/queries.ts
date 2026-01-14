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

// Documents
export const DOCUMENTS_BY_USER_QUERY = gql`
  query DocumentsByUser($userId: String!) {
    documentsByUser(userId: $userId) {
      id
      title
      createdAt
    }
  }
`;

export const CREATE_DOCUMENT_MUTATION = gql`
  mutation CreateDocument($title: String!, $userId: String!) {
    createDocument(title: $title, userId: $userId) {
      id
      title
      createdAt
    }
  }
`;

export const DELETE_DOCUMENT_MUTATION = gql`
  mutation DeleteDocument($id: String!) {
    deleteDocument(id: $id) {
      id
    }
  }
`;