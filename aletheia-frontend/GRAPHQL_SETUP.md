# GraphQL Frontend-Backend Integration

This document explains how the frontend is configured to communicate with the backend GraphQL API.

## Architecture Overview

```
Frontend (Next.js)          Backend (NestJS)
     │                            │
     │  HTTP Request              │
     ├───────────────────────────>│
     │  (GraphQL Query/Mutation)  │
     │                            │
     │  JSON Response             │
     │<───────────────────────────┤
     │  (GraphQL Data)             │
```

## Components

### 1. Apollo Client (`app/services/apollo-client.ts`)

The Apollo Client is configured with:
- **HTTP Link**: Connects to `http://localhost:3000/graphql`
- **Auth Link**: Automatically adds JWT token to request headers
- **Error Link**: Handles GraphQL and network errors
- **InMemoryCache**: Caches query results

### 2. Apollo Provider (`app/providers/apollo-provider.tsx`)

Wraps the entire app to provide Apollo Client context to all components.

### 3. Authentication Utilities (`app/lib/utils/auth.ts`)

Functions for managing JWT tokens:
- `getAuthToken()` - Retrieve token from localStorage
- `setAuthToken(token)` - Store token in localStorage
- `removeAuthToken()` - Clear token
- `isAuthenticated()` - Check if user is logged in

### 4. Authentication Hook (`app/hooks/useAuth.ts`)

React hook that provides:
- `login(email, password)` - Login mutation
- `logout()` - Clear authentication
- `token` - Current JWT token
- `isAuthenticated` - Authentication status
- `loading` - Loading state
- `error` - Error state

## How It Works

### Making a Query

```typescript
'use client';

import { useQuery } from '@apollo/client/react';
import { gql } from '@apollo/client';

const MY_QUERY = gql`
  query MyQuery {
    hello
  }
`;

export function MyComponent() {
  const { data, loading, error } = useQuery(MY_QUERY);
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return <div>{data?.hello}</div>;
}
```

### Making a Mutation

```typescript
'use client';

import { useMutation } from '@apollo/client/react';
import { gql } from '@apollo/client';

const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password)
  }
`;

export function LoginComponent() {
  const [login, { loading, error }] = useMutation(LOGIN_MUTATION);
  
  const handleLogin = async () => {
    const { data } = await login({
      variables: { email: 'user@example.com', password: 'pass' },
    });
    // Token automatically stored via auth link
  };
  
  return <button onClick={handleLogin}>Login</button>;
}
```

### Authentication Flow

1. User submits login form
2. `login` mutation is called with email/password
3. Backend validates credentials and returns JWT token
4. Token is stored in localStorage via `setAuthToken()`
5. Auth link automatically adds token to all subsequent requests
6. Protected queries/mutations now work with authentication

## Request Headers

All GraphQL requests automatically include:

```
Authorization: Bearer <jwt-token>
```

This is handled by the auth link in `apollo-client.ts`.

## Error Handling

The error link handles:
- **GraphQL Errors**: Logged to console, authentication errors clear token
- **Network Errors**: Logged to console

You can customize error handling in `app/services/apollo-client.ts`.

## Environment Configuration

Set these in `.env.local`:

```env
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:3000/graphql
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## CORS Configuration

The backend is configured to accept requests from:
- `http://localhost:3000`
- `http://localhost:3030`

If you change the frontend port, update the backend CORS configuration in `aletheia-backend/src/main.ts`.

## Testing the Connection

1. Start the backend: `npm run start:backend`
2. Start the frontend: `npm run start:frontend`
3. Open `http://localhost:3030`
4. You should see the "GraphQL Query Example" section showing data from the backend
5. Try logging in with valid credentials

## Available Backend Queries/Mutations

See the backend GraphQL schema at `aletheia-backend/src/schema.gql` for all available:
- Queries (read operations)
- Mutations (write operations)
- Types and their fields

## Next Steps

1. Add more GraphQL queries/mutations as needed
2. Create custom hooks for each query/mutation
3. Add loading states and error handling to your components
4. Implement proper TypeScript types for GraphQL responses
5. Consider using GraphQL Code Generator for type safety
