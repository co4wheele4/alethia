# Contributing to Aletheia

## Repository context (required)

Aletheia follows a **non-inferential, governed** epistemic model: inspectable traceability, no assumed confidence, and strict GraphQL contract fidelity.

**All contributors and automated agents must read and follow:**

- [`docs/context/aletheia-core-context.md`](docs/context/aletheia-core-context.md)

Cursor loads [`.cursor/rules/aletheia-core-context.mdc`](.cursor/rules/aletheia-core-context.mdc) as an always-on project rule that points to that canonical file.

**Changes that conflict** with that model or with binding ADRs **require ADR review** before implementation. Do not bypass this by narrowing scope in code comments or mocks.

For Architecture Decision Records, see [`docs/adr/`](docs/adr/) and the [ADR index](docs/adr/INDEX.md).

## CI and installs (monorepo)

- **Install and test from the repository root** (`npm ci`). Do not rely on a per-package lockfile under `aletheia-backend/`; dependency versions are pinned in the root `package-lock.json` only.
- **Merge gate:** Configure branch protection so the default branch requires **[`mvp-release-gate`](.github/workflows/mvp-release-gate.yml)** (and **[`governance-bot`](.github/workflows/governance-bot.yml)** per [docs/compliance/mvp-branch-protection.md](docs/compliance/mvp-branch-protection.md)). The separate [`Tests`](.github/workflows/test.yml) workflow adds redundancy (Codecov upload, resolver e2e reminder).
- **ADR index:** After changing [`scripts/publish-adr-index.cjs`](scripts/publish-adr-index.cjs), run `npm run adr:index:publish` and commit `docs/adr/index.json`. CI enforces that the published file matches the committed copy.
- **`patch-package`:** Changes under `patches/` need the same scrutiny as dependency upgrades (reproducibility and security). Review the full diff, not only `package.json`.
