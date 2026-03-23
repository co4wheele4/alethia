/**
 * ADR-022: Type-level epistemic guardrails.
 *
 * Enforce that Claim, Evidence, and Graph types do NOT include forbidden derived-semantic fields.
 * Use EnforceNoForbidden<T> to wrap types and get compile-time errors if forbidden keys exist.
 *
 * Derived semantics are forbidden (ADR-022)
 */

export type ForbiddenKeys =
  | 'score'
  | 'confidence'
  | 'rank'
  | 'relevance'
  | 'summary'
  | 'relatedClaims'
  | 'similarClaims'
  | 'strength'
  | 'weight'
  | 'priority';

/**
 * Maps T such that any key in ForbiddenKeys becomes `never`.
 * If T has a forbidden key, the resulting type will error when accessed.
 */
export type EnforceNoForbidden<T> = {
  [K in keyof T]: K extends ForbiddenKeys ? never : T[K]
};

/**
 * Assert that type T does not have any ForbiddenKeys.
 * Use as: type SafeClaim = AssertNoForbidden<Claim>;
 * Will fail to compile if Claim has score, confidence, etc.
 */
export type AssertNoForbidden<T> = ForbiddenKeys extends keyof T
  ? { _error: 'Type contains forbidden epistemic fields'; _forbidden: Pick<T, ForbiddenKeys & keyof T> }
  : T;
