# Operations runbook (Aletheia)

Concise procedures for local development, test data, and release checks. For product behavior and epistemic rules, see ADRs under `docs/adr/`.

## Local stack

- **Install:** from repo root, `npm install`.
- **Database:** PostgreSQL; point `aletheia-backend` `DATABASE_URL` at your instance.
- **Migrations:** `cd aletheia-backend && npx prisma migrate deploy`.
- **Dev servers:** from root, `npm run dev` (or `npm run start:backend` / `npm run start:frontend` separately). Frontend defaults are defined in the frontend package (see `aletheia-frontend/scripts/next-port.cjs`).

## Test database seed

- **Command:** `npm run db:seed:test` (runs the backend `db:seed:test` script).
- **Safety:** use only against a dedicated test database (e.g. `aletheia_test`), never production. See `docs/dev/test-seed.md`.
- **Purpose:** deterministic users, documents, claims, evidence, review coordination rows, and minimal entity/relationship rows for UI smoke checks.

## Demo documentation consistency

- **Walkthrough:** `docs/demo/feature-walkthrough.md` lists stable IDs and flows.
- **Check:** from repo root, `npm run verify:demo-ids`. This fails if any UUID in the walkthrough is missing from `aletheia-backend/scripts/seed/test-seed.lib.ts`.
- **In-app copy:** `/demo` (linked from the dashboard) renders the same markdown file when the app runs from the monorepo layout.

## Quality gates (before merge)

- **Monorepo:** `npm test` at root runs workspace lint/typecheck and the aggregated unit test script.
- **Schema:** `npm run schema:check`.
- **Guardrails:** `npm run test:guardrails` where applicable for PRs touching GraphQL or agent surfaces.
- **Frontend E2E:** `npm run test:e2e --workspace=aletheia-frontend` when UI routes change (requires Playwright browsers as documented in that package).

## Deploy notes

- Build artifacts: `npm run build:backend` and `npm run build:frontend` (or workspace `build`).
- Ensure production `DATABASE_URL` and JWT secrets are set via environment variables expected by the backend; never commit secrets.
- The demo walkthrough page reads `docs/demo/feature-walkthrough.md` from disk at request time in development; in minimal deployments without the docs tree, `/demo` shows a short fallback message unless the file is packaged or replicated.
