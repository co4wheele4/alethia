# Developer rules (governance)

## Canonical repository context

[`docs/context/aletheia-core-context.md`](../context/aletheia-core-context.md) is the **canonical** Aletheia project context for this repository. Consult it **before** making changes that touch schema, resolvers, GraphQL operations, UI, ADRs, CI, ingestion, search, or graph structures.

Aletheia’s model is **non-inferential** and **governed**: no assumed backend fields, no confidence surface, traceability-first explainability, and ADR-025 limits on agent-like automation.

Work that **conflicts** with that document or with accepted ADRs must go through **ADR review** (propose or amend an ADR) rather than being implemented ad hoc.

## Cursor

The persistent Cursor rule [`.cursor/rules/aletheia-core-context.mdc`](../../.cursor/rules/aletheia-core-context.mdc) references the canonical file and applies to all areas of the repo.
