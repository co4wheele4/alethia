'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { nanoid } from 'nanoid';

import type { ReviewerQueueItem, ReviewerQueueSeedItem } from './types';

type ReviewerQueueContextValue = {
  items: ReviewerQueueItem[];
  /**
   * Adds items to the in-memory queue.
   *
   * IMPORTANT:
   * - This is a UI-only coordination aid (ADR-012/013).
   * - It must never trigger backend calls or mutate claim lifecycle.
   */
  enqueue: (items: ReviewerQueueSeedItem[]) => void;
  clear: () => void;
};

const ReviewerQueueContext = createContext<ReviewerQueueContextValue | null>(null);

function fingerprint(item: ReviewerQueueSeedItem) {
  return `${item.claimId}::${item.source}::${item.requestedFrom ?? ''}::${item.claimText}`;
}

export function ReviewerQueueProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ReviewerQueueItem[]>([]);

  const enqueue = useCallback((incoming: ReviewerQueueSeedItem[]) => {
    if (!Array.isArray(incoming) || incoming.length === 0) return;

    setItems((prev) => {
      const seen = new Set(prev.map((p) => fingerprint(p)));
      const appended: ReviewerQueueItem[] = [];
      for (const seed of incoming) {
        if (!seed?.claimId || !seed?.claimText || !seed?.source) continue;
        const key = fingerprint(seed);
        if (seen.has(key)) continue;
        seen.add(key);
        appended.push({
          id: nanoid(),
          claimId: seed.claimId,
          claimText: seed.claimText,
          source: seed.source,
          requestedFrom: seed.requestedFrom,
          createdAtMs: Date.now(),
        });
      }
      return appended.length ? [...appended, ...prev] : prev;
    });
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<ReviewerQueueContextValue>(() => ({ items, enqueue, clear }), [items, enqueue, clear]);

  return <ReviewerQueueContext.Provider value={value}>{children}</ReviewerQueueContext.Provider>;
}

export function useReviewerQueue() {
  const ctx = useContext(ReviewerQueueContext);
  if (!ctx) {
    throw new Error('useReviewerQueue must be used within ReviewerQueueProvider');
  }
  return ctx;
}

