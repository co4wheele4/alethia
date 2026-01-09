# Aletheia Monorepo

This is the root monorepo for the Aletheia full-stack application.

## Structure

```
aletheia/
├── aletheia-backend/    # NestJS GraphQL API backend
└── aletheia-frontend/   # Frontend application
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)
- PostgreSQL database (for backend)

### Installation

Install dependencies for all workspaces:

```bash
npm install
```

This will install dependencies for both the backend and frontend projects. The monorepo uses npm workspaces, so all dependencies are managed from the root.

### Development

#### Run Both Projects Concurrently (Recommended)

Run both backend and frontend in development mode simultaneously:

```bash
npm run dev
# or
npm run start:all
```

This will start:
- Backend on `http://localhost:3000` (or configured port)
- Frontend on `http://localhost:3001` (Next.js default)

#### Run Projects Separately

Run projects individually in separate terminals:

```bash
# Start backend only
npm run start:backend

# Start frontend only
npm run start:frontend
```

### Building

Build all projects:

```bash
npm run build
```

Build individual projects:

```bash
npm run build:backend
npm run build:frontend
```

### Testing

Run all tests:

```bash
npm run test
```

Run tests for specific workspace:

```bash
npm run test:backend
npm run test:frontend
```

Run backend e2e tests:

```bash
npm run test:e2e
```

### Linting and Formatting

Lint all projects:

```bash
npm run lint
```

Lint individual projects:

```bash
npm run lint:backend
npm run lint:frontend
```

Format all projects:

```bash
npm run format
```

Format individual projects:

```bash
npm run format:backend
npm run format:frontend
```

### Production

Start backend in production mode:

```bash
npm run start:prod:backend
```

Start frontend in production mode (after building):

```bash
npm run build:frontend
npm run start:prod:frontend
```

### Database

Seed the database:

```bash
npm run seed
```

### Cleanup

Remove all node_modules and build artifacts:

```bash
npm run clean:all
```

## Workspace Scripts

### Backend (`aletheia-backend`)

See [aletheia-backend/README.md](./aletheia-backend/README.md) for detailed backend documentation.

Key scripts:
- `npm run start:dev --workspace=aletheia-backend` - Start backend in development mode
- `npm run test:all --workspace=aletheia-backend` - Run all backend tests
- `npm run seed --workspace=aletheia-backend` - Seed the database

### Frontend (`aletheia-frontend`)

See [aletheia-frontend/README.md](./aletheia-frontend/README.md) for detailed frontend documentation.

## Project Structure

```
aletheia/
├── aletheia-backend/     # NestJS GraphQL API backend
│   ├── src/              # Source code
│   ├── test/             # E2E tests
│   ├── prisma/           # Database schema and migrations
│   └── dist/             # Build output
├── aletheia-frontend/    # Next.js frontend application
│   ├── app/              # Next.js app directory
│   ├── public/           # Static assets
│   └── .next/            # Build output
├── docs/                 # Project documentation
├── scripts/              # Shared scripts
├── package.json          # Root package.json with workspace configuration
└── .npmrc                # NPM workspace configuration
```

### Workspaces

- **Backend** (`aletheia-backend`): NestJS GraphQL API with PostgreSQL, Prisma ORM, and **100% test coverage** (389 unit tests, 51 e2e tests)
- **Frontend** (`aletheia-frontend`): Next.js 16 application with React 19, Apollo Client, and Tailwind CSS

## Project Status

- ✅ **Backend**: Production ready with 100% test coverage
- ✅ **Frontend**: Functional and ready for feature development
- ✅ **Monorepo**: Well-organized with npm workspaces
- ✅ **Documentation**: Comprehensive documentation available

See [PROJECT_REVIEW.md](./PROJECT_REVIEW.md) for detailed project analysis.

## Contributing

1. Make changes in the appropriate workspace
2. Run tests: `npm run test`
3. Run linting: `npm run lint`
4. Commit changes

## License

UNLICENSED - Private project
