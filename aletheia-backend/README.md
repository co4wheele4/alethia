<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456

[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

**Aletheia Backend** — A NestJS service that exposes a **GraphQL** API for **traceable** claims, evidence, documents, and human adjudication. The system does **not** expose confidence scores or model “verdicts” as product truth; see repository `docs/context/aletheia-core-context.md` and ADRs.

### Tech Stack
- **Framework**: NestJS 11
- **API**: GraphQL (Apollo Server) — **primary** application interface
- **REST / OpenAPI**: Minimal HTTP surface (`GET /`, `GET /health`) with **Swagger UI** at `/api` for discoverability; see below
- **Database**: PostgreSQL with Prisma ORM
- **Language**: TypeScript (strict mode)

### Features
- GraphQL API (domain: claims, evidence, documents, review, integrity, search per ADRs)
- Optional **OpenAPI** catalog for the small REST layer and pointers to GraphQL
- **100% test coverage** (unit + e2e; see `package.json` / CI for current counts)
- Type-safe database queries with Prisma

## Prerequisites

- Node.js **20 LTS** or newer (monorepo `.nvmrc`)
- PostgreSQL database
- npm or pnpm

## Project Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd aletheia-backend
```

2. **Install dependencies**
```bash
npm install
# or
pnpm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` and configure:
- `DATABASE_URL`: PostgreSQL connection string
- Optional: `OPENAI_API_KEY` — only if you enable future, ADR-governed integrations (MVP does not require the `openai` npm package; env key may still exist for optional config)

4. **Set up the database**
```bash
# Run migrations
npx prisma migrate dev

# (Optional) Seed the database
npm run seed
# Note: The seed script provides detailed logging showing which database is being seeded and how many rows were inserted
```

## Development

### Running the Application

```bash
# Development mode (with hot reload)
npm run start:dev

# Production mode
npm run start:prod

# Debug mode
npm run start:debug
```

The GraphQL API will be available at:
- **GraphQL Playground**: http://localhost:3000/graphql
- **GraphQL Endpoint**: http://localhost:3000/graphql

**OpenAPI (Swagger):** In development, or in production if `ENABLE_SWAGGER=true` or `1`:

- **Swagger UI**: http://localhost:3000/api  
- **OpenAPI JSON**: http://localhost:3000/api/json  

The document describes the **REST** routes and links to GraphQL; the **authoritative** API for the product is still **GraphQL** (`POST /graphql`).

### Database Management

```bash
# Generate Prisma Client
npx prisma generate

# Create a new migration
npx prisma migrate dev --name migration_name

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# View database in Prisma Studio
npx prisma studio
```

## Testing

The project has comprehensive test coverage with both unit and e2e tests.

```bash
# Run unit tests
npm run test

# Run unit tests in watch mode
npm run test:watch

# Run e2e tests
npm run test:e2e

# Run all tests (unit + e2e)
npm run test:all

# Generate test coverage report
npm run test:cov

# E2E test coverage
npm run test:e2e:cov
```

### Test Organization

- **Unit Tests**: Located alongside source files (`*.spec.ts`)
- **E2E Tests**: Organized in `test/e2e/` directory
  - `resolvers/`: Resolver-specific tests
  - `cross-cutting/`: Cross-cutting concerns (errors, validation, pagination, etc.)

See [test/E2E_COVERAGE_ANALYSIS.md](test/E2E_COVERAGE_ANALYSIS.md) for detailed test coverage information.

## API Documentation

### GraphQL Schema

The GraphQL schema is auto-generated and available at `src/schema.gql`. You can explore the API using GraphQL Playground at http://localhost:3000/graphql.

### Main Resolvers

- **UserResolver**: User management (CRUD operations)
- **LessonResolver**: Lesson management
- **DocumentResolver**: Document management
- **DocumentChunkResolver**: Document chunk operations
- **EntityResolver**: Entity management
- **EntityMentionResolver**: Entity mention tracking
- **EntityRelationshipResolver**: Entity relationship management
- **EmbeddingResolver**: Embedding vector management
- **AiQueryResolver**: AI query processing
- **AiQueryResultResolver**: AI query results

### Example Queries

```graphql
# Get all users
query {
  users {
    id
    email
    name
  }
}

# Create a user
mutation {
  createUser(email: "user@example.com", name: "John Doe") {
    id
    email
  }
}

# Get user with related data
query {
  user(id: "user-id") {
    id
    email
    lessons {
      id
      title
    }
    documents {
      id
      title
    }
  }
}
```

## Project Structure

```
aletheia-backend/
├── src/
│   ├── app/              # Main application module
│   ├── auth/             # Authentication & authorization
│   ├── common/           # Shared utilities (filters, guards, dataloaders)
│   ├── config/           # Configuration & validation
│   ├── graphql/
│   │   ├── inputs/       # GraphQL input types
│   │   ├── models/       # GraphQL model types
│   │   └── resolvers/    # GraphQL resolvers
│   ├── ingestion/        # Document ingestion & extraction
│   ├── openai/           # OpenAI service integration
│   └── prisma/           # Prisma service
│   └── test-utils/       # Test utilities and mock factories
├── prisma/
│   ├── schema.prisma     # Database schema
│   ├── migrations/       # Database migrations
│   └── seed.ts           # Database seed script
├── test/
│   ├── e2e/              # End-to-end tests
│   └── helpers/          # Test utilities
└── dist/                 # Compiled output
```

## Deployment

### Production Checklist

Before deploying to production, ensure:

- [ ] Environment variables are properly configured
- [ ] Database migrations are up to date
- [ ] Authentication/authorization is implemented (see [PROJECT_REVIEW.md](PROJECT_REVIEW.md))
- [ ] Input validation is enabled
- [ ] Error handling is implemented
- [ ] CORS is properly configured
- [ ] Security headers are set
- [ ] Logging is configured
- [ ] Health checks are implemented

See [PROJECT_REVIEW.md](PROJECT_REVIEW.md) for detailed recommendations.

### Build for Production

```bash
# Build the application
npm run build

# Start production server
npm run start:prod
```

## Additional Documentation

- [PROJECT_REVIEW.md](PROJECT_REVIEW.md) - Comprehensive project review and recommendations
- [test/E2E_COVERAGE_ANALYSIS.md](test/E2E_COVERAGE_ANALYSIS.md) - Detailed test coverage analysis
- [test/TESTING_GUIDELINES.md](test/TESTING_GUIDELINES.md) - Testing guidelines and best practices
- [TESTING_SETUP.md](TESTING_SETUP.md) - Test setup and configuration guide

## Scripts Reference

```bash
# Development
npm run start:dev          # Start in development mode with hot reload
npm run start:debug         # Start in debug mode

# Building
npm run build               # Build the application
npm run start:prod          # Start production server

# Testing
npm run test                # Run unit tests
npm run test:watch          # Run unit tests in watch mode
npm run test:cov            # Generate test coverage
npm run test:e2e            # Run e2e tests
npm run test:all            # Run all tests

# Database
npm run seed                # Seed the database
npx prisma studio           # Open Prisma Studio

# HTML crawl ingestion (creates `HtmlCrawlIngestionRun` + `Evidence` per URL; default seed is CNN)
# Requires Postgres + migrations and at least one user (e.g. `npm run db:seed:test` against `aletheia_test`).
npx dotenv-cli -e .env.test -- npm run html-crawl:run
# Optional: `npx dotenv-cli -e .env.test -- npm run html-crawl:run -- https://edition.cnn.com/`
# Optional env: `HTML_CRAWL_USER_ID`, `CRAWL_DEPTH`, `MAX_PAGES`

# Code Quality
npm run lint                # Run ESLint
npm run format              # Format code with Prettier
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Ensure all tests pass (`npm run test:all`)
4. Run linting (`npm run lint`)
5. Submit a pull request

## Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [GraphQL Documentation](https://graphql.org/learn/)
- [Apollo Server Documentation](https://www.apollographql.com/docs/apollo-server/)

## License

This project is private and unlicensed.
