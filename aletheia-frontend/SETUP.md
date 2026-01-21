# Frontend Setup Guide

## Environment Variables

Create a `.env.local` file in the `aletheia-frontend` directory with the following:

```env
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:3000/graphql
NEXT_PUBLIC_API_URL=http://localhost:3000
```

This file should NOT be committed to git (it's already in .gitignore).

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Create `.env.local`** (see above)

3. **Start the backend** (in a separate terminal):
   ```bash
   npm run start:backend
   ```

4. **Start the frontend**:
   ```bash
   npm run dev
   ```

5. **Open your browser**:
   Navigate to `http://localhost:3030`

## Making GraphQL Calls

### Example 1: Simple Query

```typescript
'use client';

import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';

const HELLO_QUERY = gql`
  query Hello {
    hello
  }
`;

export function MyComponent() {
  const { data, loading, error } = useQuery(HELLO_QUERY);
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return <div>{data?.hello}</div>;
}
```

### Example 2: Mutation with Authentication

```typescript
'use client';

import { useMutation } from '@apollo/client';
import { gql } from '@apollo/client';

const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password)
  }
`;

export function LoginComponent() {
  const [login, { loading, error }] = useMutation(LOGIN_MUTATION);
  
  const handleLogin = async () => {
    try {
      const { data } = await login({
        variables: {
          email: 'user@example.com',
          password: 'password123',
        },
      });
      // Token is automatically stored via auth link
      console.log('Logged in!', data);
    } catch (err) {
      console.error('Login failed:', err);
    }
  };
  
  return (
    <button onClick={handleLogin} disabled={loading}>
      {loading ? 'Logging in...' : 'Login'}
    </button>
  );
}
```

### Example 3: Using Custom Hooks

See the example hooks in `app/hooks/`:
- `useAuth.ts` - Authentication management
- `useHello.ts` - Example query hook

## Authentication Flow

1. User logs in via `login` mutation
2. JWT token is returned
3. Token is automatically stored in localStorage
4. Token is automatically added to all subsequent GraphQL requests
5. On logout, token is removed

The authentication is handled automatically by the Apollo Client configuration in `app/services/apollo-client.ts`.

## Troubleshooting

### CORS Errors

Make sure the backend CORS configuration includes your frontend URL. The backend is configured to allow:
- `http://localhost:3000`
- `http://localhost:3030`

### Connection Errors

1. Verify the backend is running: `http://localhost:3000/graphql`
2. Check the `NEXT_PUBLIC_GRAPHQL_URL` in `.env.local`
3. Check browser console for detailed error messages

### Authentication Issues

1. Verify the token is being stored: Check localStorage for `aletheia_auth_token`
2. Check network tab to see if Authorization header is being sent
3. Verify backend JWT_SECRET is configured
