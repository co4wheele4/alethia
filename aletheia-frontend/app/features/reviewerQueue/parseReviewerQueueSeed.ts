import type { ReviewerQueueSeedItem, ReviewRequestSource } from './types';

function safeJsonParse<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function toSource(requestedFrom: string | null | undefined): ReviewRequestSource {
  return requestedFrom === 'compare' ? 'comparison' : 'manual';
}

/**
 * Derives queue entries from URL query params only (no backend calls).
 *
 * Supported encodings:
 * - `item=` repeated query param containing JSON: {"claimId":"...","claimText":"...","requestedFrom":"compare","source":"comparison"}
 * - Legacy/simple: `claimId=...&claimText=...&requestedFrom=compare`
 */
export function parseReviewerQueueSeedFromSearchParams(params: URLSearchParams): ReviewerQueueSeedItem[] {
  const seeds: ReviewerQueueSeedItem[] = [];

  const itemParams = params.getAll('item').filter(Boolean);
  for (const raw of itemParams) {
    const parsed = safeJsonParse<Partial<ReviewerQueueSeedItem>>(raw);
    const claimId = typeof parsed?.claimId === 'string' ? parsed.claimId : '';
    const claimText = typeof parsed?.claimText === 'string' ? parsed.claimText : '';
    const requestedFrom = typeof parsed?.requestedFrom === 'string' ? parsed.requestedFrom : undefined;
    const source =
      parsed?.source === 'comparison' || parsed?.source === 'manual'
        ? parsed.source
        : toSource(requestedFrom);
    if (claimId && claimText) {
      seeds.push({ claimId, claimText, source, requestedFrom });
    }
  }

  // Simple/legacy form (single item).
  const claimId = params.get('claimId');
  const claimText = params.get('claimText');
  const requestedFrom = params.get('requestedFrom');
  if (claimId && claimText) {
    seeds.push({
      claimId,
      claimText,
      requestedFrom: requestedFrom ?? undefined,
      source: toSource(requestedFrom),
    });
  }

  return seeds;
}

