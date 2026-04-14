/**
 * ADR-022: Derived-semantics guard — canonical pattern list for tooling and reviews.
 *
 * The executable schema lint lives in `aletheia-backend/scripts/schema-lint-adr022.cjs`.
 * Keep the regex list aligned with that file.
 */
export const FORBIDDEN_FIELD_NAME_REGEXES: readonly RegExp[] = [
  /score/i,
  /confidence/i,
  /rank/i,
  /relevance/i,
  /similar/i,
  /related/i,
  /summary/i,
  /aggregate/i,
  /conflict/i,
  /recommended/i,
  /weight/i,
  /strength/i,
];

/** Forbidden top-level Query field argument names (non-allowlisted). */
export const FORBIDDEN_QUERY_ARG_REGEXES: readonly RegExp[] = [
  /^orderBy$/i,
  /^sort$/i,
  /^compare/i,
];
