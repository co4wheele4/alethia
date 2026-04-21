# Monorepo Setup Guide

This document describes the monorepo structure and configuration for the Aletheia project.

## Overview

This project uses **npm workspaces** to manage multiple packages in a single repository. The monorepo contains:

- `aletheia-backend` - NestJS GraphQL API backend
- `aletheia-frontend` - Next.js frontend application

## Workspace Configuration

### Root `package.json`

The root `package.json` defines the workspaces:

```json
{
  "workspaces": [
    "aletheia-backend",
    "aletheia-frontend"
  ]
}
```

### `.npmrc` Configuration

The `.npmrc` file configures npm workspace behavior:

- **Workspace Protocol**: Uses workspace protocol for dependencies
- **Hoisting**: Hoists dependencies to root `node_modules` when possible
- **Auto-install Peers**: Automatically installs peer dependencies

## Dependency Management

### Installing Dependencies

Install all dependencies for all workspaces:

```bash
npm install
```

This will:
1. Install root dependencies
2. Install workspace dependencies
3. Hoist shared dependencies to root `node_modules`
4. Link workspaces together

### Adding Dependencies

Add a dependency to a specific workspace:

```bash
# Backend
npm install <package> --workspace=aletheia-backend

# Frontend
npm install <package> --workspace=aletheia-frontend

# Root (dev dependencies)
npm install <package> --save-dev
```

### Workspace Dependencies

To reference one workspace from another, use the workspace protocol:

```json
{
  "dependencies": {
    "aletheia-backend": "workspace:*"
  }
}
```

## Scripts

### Root Scripts

All scripts can be run from the root:

```bash
# Development
npm run dev              # Run both backend and frontend concurrently
npm run start:all        # Same as above
npm run start:backend   # Backend only
npm run start:frontend   # Frontend only

# Building
npm run build            # Build all workspaces
npm run build:backend    # Build backend only
npm run build:frontend   # Build frontend only

# Testing
npm run test             # Run all tests
npm run test:backend     # Backend tests only
npm run test:frontend    # Frontend tests only
npm run test:e2e         # Backend e2e tests

# Linting & Formatting
npm run lint             # Lint all workspaces
npm run format           # Format all workspaces

# Cleanup
npm run clean            # Clean build artifacts
npm run clean:all        # Clean everything including node_modules
```

### Workspace Scripts

Run scripts directly in a workspace:

```bash
# Using workspace flag
npm run <script> --workspace=aletheia-backend
npm run <script> --workspace=aletheia-frontend

# Or cd into the workspace
cd aletheia-backend
npm run <script>
```

## Project Structure

```
aletheia/
├── .npmrc                    # NPM workspace configuration
├── package.json              # Root package.json with workspaces
├── .gitignore                # Root gitignore
├── README.md                 # Main project README
│
├── aletheia-backend/         # Backend workspace
│   ├── package.json          # Backend dependencies
│   ├── src/                  # Source code
│   ├── test/                 # Tests
│   └── prisma/               # Database schema
│
├── aletheia-frontend/        # Frontend workspace
│   ├── package.json          # Frontend dependencies
│   ├── app/                  # Next.js app directory
│   └── public/               # Static assets
│
├── docs/                     # Documentation
└── scripts/                  # Shared scripts
```

## Benefits of Monorepo

1. **Shared Dependencies**: Common dependencies are hoisted, reducing duplication
2. **Unified Tooling**: Single configuration for linting, formatting, testing
3. **Atomic Commits**: Changes across frontend and backend can be committed together
4. **Easier Refactoring**: Rename types/interfaces across both projects easily
5. **Simplified CI/CD**: Single repository to build and deploy

## Troubleshooting

### Dependency Issues

If you encounter dependency conflicts:

1. Clear all node_modules:
   ```bash
   npm run clean:all
   ```

2. Reinstall:
   ```bash
   npm install
   ```

### Workspace Not Found

If npm can't find a workspace:

1. Verify workspace names in root `package.json` match folder names
2. Ensure workspace folders exist
3. Run `npm install` from root

### Build Issues

If builds fail:

1. Check that all dependencies are installed: `npm install`
2. Verify TypeScript configuration in each workspace
3. Check for circular dependencies between workspaces

## Best Practices

1. **Keep Workspaces Independent**: Each workspace should be able to run independently
2. **Shared Code**: Use workspace protocol for shared packages (if you add any)
3. **Version Management**: Keep versions consistent across workspaces when possible
4. **Scripts**: Prefer root-level scripts for common operations
5. **Documentation**: Keep workspace-specific docs in their respective folders

## Next Steps

- Consider adding shared packages (e.g., `@aletheia/shared-types`) if types need to be shared
- Set up CI/CD to build and test all workspaces
- Configure pre-commit hooks for linting and formatting
