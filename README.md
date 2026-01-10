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
- **Frontend** (`aletheia-frontend`): Next.js 15 application with React 19, Apollo Client 4, and Tailwind CSS 4

## Project Status

- ✅ **Backend**: Production ready with 100% test coverage (395 unit tests, 56 e2e tests)
- ✅ **Frontend**: All issues resolved, ready for feature development (0 TypeScript errors, 0 lint errors)
- ✅ **Features**: Login and Register fully functional in both backend and frontend
- ✅ **Monorepo**: Fully converted to true monorepo structure with npm workspaces
- ✅ **Git Hooks**: Pre-push hook configured to run all tests automatically
- ✅ **Documentation**: Comprehensive documentation available
- ✅ **Configuration**: Clean npm configuration (no deprecation warnings)

### Latest Updates (January 10, 2026)

- ✅ **Registration Feature**: Added user registration to both backend and frontend
  - Backend: New `register` mutation with comprehensive tests (6 unit + 5 e2e tests)
  - Frontend: Register form with Login/Register toggle, auto-login after registration
- ✅ **Test Coverage**: Maintained 100% coverage with new tests (395 unit, 56 e2e)
- ✅ **Code Quality**: All TypeScript and ESLint errors resolved
- ✅ **Type Safety**: Fixed Apollo Client type issues (v4 compatibility)

### Previous Updates (January 9, 2026)

- ✅ **Monorepo Structure**: Converted backend and frontend from submodules to true monorepo
- ✅ **Frontend Fixes**: Fixed all Apollo Client integration issues, TypeScript errors, and linting errors
- ✅ **Git Hooks**: Pre-push hook automatically runs backend tests and frontend checks before pushing
- ✅ **Configuration**: Removed deprecated npm options, eliminated all warnings

See [PROJECT_REVIEW.md](./PROJECT_REVIEW.md) for detailed project analysis.

## Contributing

1. Make changes in the appropriate workspace
2. Run tests: `npm run test`
3. Run linting: `npm run lint`
4. Commit changes
5. Push changes (pre-push hook will automatically run all tests)

### Git Hooks

A pre-push hook is configured to automatically:
- Run all backend tests (unit + e2e)
- Run frontend linting
- Run frontend type checking

If any checks fail, the push will be blocked. To bypass (not recommended):
```bash
git push --no-verify
```

## License

UNLICENSED - Private project
