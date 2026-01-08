# GraphQL Test Queries for User Table

## Step 1: Get a JWT Token (Required for User Queries)

**Login Mutation (No auth required - public endpoint):**
```graphql
mutation Login {
  login(email: "alice@example.com", password: "any-password")
}
```

**Note:** Password validation isn't implemented yet, so any password works. Just needs a valid email.

**Response:**
```json
{
  "data": {
    "login": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Copy the token!**

## Step 2: Add Token to Headers

In GraphQL Playground, go to the **HTTP HEADERS** section (bottom panel) and add:
```json
{
  "Authorization": "Bearer YOUR_TOKEN_HERE"
}
```

Replace `YOUR_TOKEN_HERE` with the token from Step 1.

---

## Available User Queries

### 1. Get All Users (Requires ADMIN role + JWT)
```graphql
query GetAllUsers {
  users {
    id
    email
    name
    createdAt
  }
}
```

### 2. Get Single User by ID (Requires JWT)
```graphql
query GetUser($userId: String!) {
  user(id: $userId) {
    id
    email
    name
    createdAt
    lessons {
      id
      title
      content
    }
    documents {
      id
      title
      createdAt
    }
    aiQueries {
      id
      query
      createdAt
    }
  }
}
```

**Variables:**
```json
{
  "userId": "your-user-id-here"
}
```

### 3. Get User with Related Data (Requires JWT)
```graphql
query GetUserWithRelations($userId: String!) {
  user(id: $userId) {
    id
    email
    name
    createdAt
    lessons {
      id
      title
      content
      createdAt
    }
    documents {
      id
      title
      createdAt
      chunks {
        id
        chunkIndex
        content
      }
    }
    aiQueries {
      id
      query
      createdAt
      results {
        id
        answer
        score
      }
    }
  }
}
```

## Test Mutations

### 4. Create User (Requires ADMIN role + JWT)
```graphql
mutation CreateUser {
  createUser(data: {
    email: "test@example.com"
    name: "Test User"
  }) {
    id
    email
    name
    createdAt
  }
}
```

### 5. Update User (Requires JWT)
```graphql
mutation UpdateUser($userId: String!) {
  updateUser(data: {
    id: $userId
    name: "Updated Name"
  }) {
    id
    email
    name
  }
}
```

### 6. Delete User (Requires JWT)
```graphql
mutation DeleteUser($userId: String!) {
  deleteUser(id: $userId) {
    id
    email
  }
}
```

## Public Query (No Auth Required)

### 7. Hello Query (Public - No Auth)
```graphql
query Hello {
  hello
}
```

## Authentication Note

**Important:** Most User queries require JWT authentication. To test these queries:

1. First, you'll need to authenticate (if auth is set up)
2. Or temporarily remove `@UseGuards(JwtAuthGuard)` from UserResolver for testing
3. Or use a tool that allows you to set Authorization headers

## Quick Test Query (Start Here)

If you want to test without authentication, try the public hello query first:

```graphql
query {
  hello
}
```

This should return: `"Hello, Aletheia!"`

Then, to test user queries, you'll need to either:
- Set up authentication and get a JWT token
- Or modify the resolver to allow unauthenticated access for testing
