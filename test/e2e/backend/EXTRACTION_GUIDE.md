# Test Extraction Guide (Legacy)

**Last Updated**: January 14, 2026  
**Status**: ✅ Migration complete (no extraction needed)

This guide used to document how to extract tests from a monolithic `graphql.e2e-spec.ts` file.

That monolithic file is **not used** in this repo anymore, and the e2e suite is already organized under:
- `test/e2e/backend/resolvers/`
- `test/e2e/backend/cross-cutting/`

The `extract-tests.ps1` script is retained for historical reference only.
