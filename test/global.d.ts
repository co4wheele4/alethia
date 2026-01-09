export {};

declare global {
  // Used by `test/setup-e2e.ts` to ensure we don't run migrations multiple times.

  var __ALETHEIA_E2E_MIGRATED__: boolean | undefined;

  // Default auth token used by `test/helpers/graphql-request.ts` when calling guarded resolvers.

  var __ALETHEIA_E2E_AUTH_TOKEN__: string | undefined;
}
