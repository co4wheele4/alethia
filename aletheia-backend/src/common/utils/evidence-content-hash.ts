import { createHash } from 'crypto';

/**
 * ADR-024: SHA-256 over UTF-8 bytes of the verbatim evidence span (reproducible audit signal).
 */
export function evidenceContentSha256Hex(verbatimUtf8: string): string {
  return createHash('sha256').update(verbatimUtf8, 'utf8').digest('hex');
}
