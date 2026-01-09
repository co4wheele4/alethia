# Aletheia Frontend

Next.js 16 frontend application for Aletheia.

## Features

- **Next.js 16** with App Router
- **React 19**
- **Apollo Client** for GraphQL
- **TypeScript**
- **Tailwind CSS** for styling
- **JWT Authentication**

## Getting Started

### Prerequisites

- Node.js 18+
- Backend server running (see `aletheia-backend`)

### Installation

Install dependencies:

```bash
npm install
```

### Environment Variables

Create a `.env.local` file in the frontend directory:

```env
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:3000/graphql
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Development

Start the development server:

```bash
npm run dev
# or from root
npm run start:frontend
```

The app will be available at `http://localhost:3001` (or the configured port).

## Project Structure

```
app/
├── components/          # React components
│   ├── ui/             # UI components (buttons, forms, etc.)
│   └── layout/         # Layout components
├── hooks/              # Custom React hooks
├── lib/                # Utilities and helpers
│   ├── constants.ts    # App constants
│   ├── utils/          # Utility functions
│   └── graphql/        # GraphQL queries and mutations
├── providers/          # Context providers (Apollo, etc.)
├── services/           # API services and clients
├── styles/             # Additional stylesheets
├── types/              # TypeScript type definitions
├── layout.tsx          # Root layout
└── page.tsx            # Home page
```

## GraphQL Integration

### Apollo Client Setup

Apollo Client is configured in `app/services/apollo-client.ts` and wrapped around the app in `app/providers/apollo-provider.tsx`.

### Making GraphQL Queries

1. **Define your query/mutation** in `app/lib/graphql/queries.ts`:

```typescript
import { gql } from '@apollo/client';

export const MY_QUERY = gql`
  query MyQuery {
    someField
  }
`;
```

2. **Create a custom hook** in `app/hooks/`:

```typescript
'use client';

import { useQuery } from '@apollo/client';
import { MY_QUERY } from '../lib/graphql/queries';

export function useMyQuery() {
  const { data, loading, error } = useQuery(MY_QUERY);
  return { data, loading, error };
}
```

3. **Use in your component**:

```typescript
'use client';

import { useMyQuery } from '../hooks/useMyQuery';

export function MyComponent() {
  const { data, loading, error } = useMyQuery();
  // ...
}
```

## Authentication

### Using the Auth Hook

The `useAuth` hook provides authentication functionality:

```typescript
import { useAuth } from '../hooks/useAuth';

function MyComponent() {
  const { token, isAuthenticated, login, logout, loading } = useAuth();
  
  // Use authentication state
}
```

### Login Example

See `app/components/ui/LoginForm.tsx` for a complete login form example.

### Token Management

Authentication tokens are automatically:
- Stored in localStorage after login
- Added to GraphQL request headers
- Cleared on logout or authentication errors

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Backend Connection

The frontend connects to the backend GraphQL API at:
- **Development**: `http://localhost:3000/graphql`
- **Production**: Configure via `NEXT_PUBLIC_GRAPHQL_URL`

Make sure the backend is running and CORS is properly configured.

## TypeScript

This project uses TypeScript. Type definitions should be added to `app/types/` directory.

## Styling

This project uses Tailwind CSS. Global styles are in `app/globals.css`.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Apollo Client Documentation](https://www.apollographql.com/docs/react/)
- [React Documentation](https://react.dev)
