# Start here — Aletheia (architects & lead engineers)

**Purpose:** One place to find binding product rules, where ADRs live, and how the backend exposes APIs—without rummaging through multiple top-level `*REVIEW*.md` files.

## Binding context

1. [`docs/context/aletheia-core-context.md`](../context/aletheia-core-context.md) — **non-negotiable** (schema-faithful UI, no confidence, no agent verdicts; ADR-025).
2. [`docs/ALETHEIA_BACKEND_GUARANTEES_V1.md`](../ALETHEIA_BACKEND_GUARANTEES_V1.md) — what the backend does and does **not** assert.
3. [`docs/roadmap/post-mvp-roadmap.md`](../roadmap/post-mvp-roadmap.md) — safe work vs “requires ADR” vs explicitly forbidden directions.

## ADR index

- Machine index: [`docs/adr/index.json`](../adr/index.json) (generated: `node scripts/publish-adr-index.cjs`).
- Human table: [`docs/adr/INDEX.md`](../adr/INDEX.md).

## API surfaces

| Surface | Path / location | Notes |
| --- | --- | --- |
| **GraphQL** (primary) | `POST /graphql`; Playground on `GET /graphql` in non-production | Schema snapshot: `aletheia-backend/src/schema.gql` |
| **OpenAPI (REST catalog)** | `/api` (Swagger UI), `/api/json` | Small REST: root `GET /`, `GET /health`. Documents pointers to GraphQL; not a second “truth” API. |
| **Node** | **20 LTS** recommended (`.nvmrc`, root `package.json` `engines`) | Aligns with CI |

## Governance and CI

- ADR checks: `npm run adr:check`, `npm run adr:index:check`, `npm run test:adr-governance`
- Epistemic guardrails: `npm run test:guardrails` (and PR workflows under `.github/workflows/`)

## Related review artifacts (historical, may overlap)

- [`docs/reviews/aletheia-expert-review-2026-04-27.md`](../reviews/aletheia-expert-review-2026-04-27.md) — expert review (**last rerun 2026-04-28**; same path, revised in place)
- [`CODEBASE_REVIEW_2026.md`](../../CODEBASE_REVIEW_2026.md)
- [`PROJECT_REVIEW.md`](../../PROJECT_REVIEW.md)

*Prefer the documents above and ADRs for truth; use reviews for context and dates.*
