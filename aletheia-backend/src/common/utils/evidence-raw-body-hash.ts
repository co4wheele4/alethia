import { createHash } from 'crypto';

/**
 * ADR-032: SHA-256 (hex) over exact fetched response bytes (immutable snapshot).
 */
export function evidenceRawBodySha256Hex(raw: Buffer): string {
  return createHash('sha256').update(raw).digest('hex');
}
