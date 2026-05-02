/**
 * Human-readable text for Apollo Client query/mutation errors (v4-compatible).
 */
export function apolloErrorText(err: unknown): string {
  if (err == null) return 'Unknown error';
  if (typeof err !== 'object') return String(err);
  const e = err as {
    message?: string;
    graphQLErrors?: readonly { message: string }[];
    errors?: readonly { message: string }[];
    networkError?: { message?: string };
  };
  const gqlMsgs = [
    ...(e.graphQLErrors?.map((x) => x.message) ?? []),
    ...(e.errors?.map((x) => x.message) ?? []),
  ].filter(Boolean);
  const n = e.networkError?.message;
  const parts = [e.message, ...gqlMsgs, n].filter((x): x is string => Boolean(x && String(x).trim()));
  return [...new Set(parts)].join(' — ') || 'Unknown error';
}
