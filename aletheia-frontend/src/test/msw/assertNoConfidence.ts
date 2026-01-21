/**
 * GraphQL contract guard: confidence is forbidden.
 *
 * WHY:
 * - The authoritative backend schema snapshot (`/src/schema.gql`) does not expose confidence.
 * - Therefore the frontend must never depend on (or accidentally mock) confidence-like fields.
 * - If mocks include confidence, the UI can silently grow an invalid dependency.
 *
 * This utility fails loudly to stop tests immediately on contract violations.
 */
export function assertNoConfidence(value: unknown, path = 'root', seen = new Set<object>()): void {
  if (value === null || value === undefined) return;

  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i += 1) {
      assertNoConfidence(value[i], `${path}[${i}]`, seen);
    }
    return;
  }

  if (typeof value !== 'object') return;
  if (seen.has(value as object)) return;
  seen.add(value as object);

  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    const key = k.toLowerCase();

    // Any confidence-like field is a hard contract violation (schema does not expose it).
    if (key.includes('confidence')) {
      throw new Error(
        `GraphQL contract violation: confidence field is not allowed (found "${k}" at ${path}.${k})`
      );
    }

    // Also forbid probability-like fields (same category of non-guaranteed scoring signals).
    if (key.includes('probability')) {
      throw new Error(
        `GraphQL contract violation: probability field is not allowed (found "${k}" at ${path}.${k})`
      );
    }

    assertNoConfidence(v, `${path}.${k}`, seen);
  }
}

