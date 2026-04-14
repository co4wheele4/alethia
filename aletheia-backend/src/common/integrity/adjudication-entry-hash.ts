import { createHash } from 'node:crypto';

/**
 * ADR-036: Deterministic SHA-256 over structural fields (no trust semantics).
 */
export function adjudicationEntryHashHex(input: {
  prevHash: string | null;
  claimId: string;
  adjudicatorId: string;
  decision: string;
  createdAt: Date;
}): string {
  const payload = [
    input.prevHash ?? '',
    input.claimId,
    input.adjudicatorId,
    input.decision,
    input.createdAt.toISOString(),
  ].join('|');
  return createHash('sha256').update(payload, 'utf8').digest('hex');
}
