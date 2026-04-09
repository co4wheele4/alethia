/**
 * Passport JWT `validate()` returns the persisted User row (`id`), not the raw token `sub`.
 * Resolvers must accept either shape.
 */
export function getGqlAuthUserId(ctx?: {
  req?: { user?: { sub?: string; id?: string } };
}): string | undefined {
  const u = ctx?.req?.user;
  return u?.sub ?? u?.id;
}
