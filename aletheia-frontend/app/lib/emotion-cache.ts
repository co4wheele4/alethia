/**
 * Emotion Cache Configuration for Next.js SSR
 * Ensures consistent style generation between server and client
 * 
 * For Next.js App Router, we need separate caches for server and client
 */

import createCache from '@emotion/cache';

// Create a consistent cache key for both server and client
const isBrowser = typeof document !== 'undefined';

export default function createEmotionCache() {
  let insertionPoint;

  /* v8 ignore start */
  if (isBrowser) {
    const emotionInsertionPoint = document.querySelector<HTMLMetaElement>(
      'meta[name="emotion-insertion-point"]'
    );
    insertionPoint = emotionInsertionPoint ?? undefined;
  }
  /* v8 ignore stop */

  return createCache({
    key: 'mui-style',
    insertionPoint,
    // Prepend: true ensures styles are inserted before existing styles
    prepend: true,
  });
}
