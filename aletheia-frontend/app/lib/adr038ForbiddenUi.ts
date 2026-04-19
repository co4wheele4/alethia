/**
 * ADR-038: User guidance and blocked-state semantics — forbidden UI copy signals.
 * Lexicon source of truth: `tools/pr-checks/adr038Lexicon.json` (kept in sync with PR guard).
 */
import lexicon from '../../../tools/pr-checks/adr038Lexicon.json';

export const ADR038_FORBIDDEN_SINGLE_WORDS: readonly string[] = lexicon.singleWordTerms;
export const ADR038_FORBIDDEN_PHRASES: readonly string[] = lexicon.phrases;

/**
 * Returns matched rule descriptions (empty if none). Case-insensitive.
 * Intended for asserting **positive** drift strings in unit tests — not for scanning UI that
 * legitimately negates banned terms next to ADR references (use Playwright phrase checks per surface).
 */
export function findAdr038ForbiddenUiMatches(text: string): string[] {
  const lower = text.toLowerCase();
  const out: string[] = [];
  for (const term of ADR038_FORBIDDEN_SINGLE_WORDS) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`\\b${escaped}\\b`, 'i');
    if (re.test(text)) out.push(`word:${term}`);
  }
  for (const phrase of ADR038_FORBIDDEN_PHRASES) {
    if (lower.includes(phrase.toLowerCase())) out.push(`phrase:${phrase}`);
  }
  return out;
}
