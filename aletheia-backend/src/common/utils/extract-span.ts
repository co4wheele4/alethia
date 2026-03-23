/**
 * Extract a substring by start/end offsets. Used for validation only (e.g. evidence
 * snippet consistency check), not for display transformation. ADR-020/022.
 */
export function extractSpan(
  content: string,
  start: number,
  end: number,
): string {
  return content.substring(start, end);
}
