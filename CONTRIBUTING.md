# Contributing to Aletheia

## Repository context (required)

Aletheia follows a **non-inferential, governed** epistemic model: inspectable traceability, no assumed confidence, and strict GraphQL contract fidelity.

**All contributors and automated agents must read and follow:**

- [`docs/context/aletheia-core-context.md`](docs/context/aletheia-core-context.md)

Cursor loads [`.cursor/rules/aletheia-core-context.mdc`](.cursor/rules/aletheia-core-context.mdc) as an always-on project rule that points to that canonical file.

**Changes that conflict** with that model or with binding ADRs **require ADR review** before implementation. Do not bypass this by narrowing scope in code comments or mocks.

For Architecture Decision Records, see [`docs/adr/`](docs/adr/) and the [ADR index](docs/adr/INDEX.md).
