# JWT Authentication Guide

## Current Status

✅ JWT authentication is set up and working
⚠️ Password validation is **not yet implemented** - authentication currently only checks if user exists by email
✅ Login mutation is **public** (no auth required) - you can call it directly

## Getting a JWT Token

### Step 1: Login Mutation (Public - No Auth Required)

In GraphQL Playground, use the login mutation:

```graphql
mutation Login {
  login(email: "alice@example.com", password: "any-password") {
    access_token
  }
}
```

**Note:** Since password validation isn't implemented yet, you can use any password. The system only checks if a user with that email exists.

### Step 2: Copy the Token

The mutation will return a JWT token:
```json
{
  "data": {
    "login": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

Copy the token value.

### Step 3: Use Token in Queries

In GraphQL Playground:
1. Go to the **HTTP HEADERS** section (bottom of Playground)
2. Add the Authorization header:
```json
{
  "Authorization": "Bearer YOUR_TOKEN_HERE"
}
```

Replace `YOUR_TOKEN_HERE` with the token you copied.

### Step 4: Test Authenticated Query

Now you can run authenticated queries:

```graphql
query GetUser($userId: String!) {
  user(id: $userId) {
    id
    email
    name
    createdAt
  }
}
```

## Available Users

Check what users exist by first creating one or checking the seed data. If you seeded the database, you might have:
- `alice@example.com` (from seed.ts)

## Creating a User (Requires ADMIN role)

If you need to create a user first, you'll need an admin token. For testing, you can temporarily remove the `@Roles(Role.ADMIN)` decorator from `createUser` mutation.

## Example Workflow

1. **Login to get token:**
```graphql
mutation {
  login(email: "alice@example.com", password: "any")
}
```

2. **Copy the token and add to headers:**
```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

3. **Query users:**
```graphql
query {
  users {
    id
    email
    name
  }
}
```

## Token Configuration

- **Expiration:** Default 7 days (configured via `JWT_EXPIRES_IN` env var)
- **Secret:** From `JWT_SECRET` env var or default: `your-secret-key-change-in-production`
- **Algorithm:** HS256 (default JWT algorithm)
