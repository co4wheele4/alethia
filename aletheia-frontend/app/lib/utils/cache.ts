/**
 * Cache utilities using Next.js 16 "use cache" directive
 * Provides explicit caching control for components and functions
 */

import { cache } from 'react';

/**
 * Cached function example
 * Using React 19 cache() for memoization
 */
export const getCachedData = cache(async (key: string) => {
  // This function will be cached per request
  // Useful for expensive computations or API calls
  return { key, timestamp: Date.now() };
});

/**
 * Example of using Next.js 16 cache directive
 * Components can use "use cache" directive for explicit caching
 */
export function createCachedFunction<T extends (...args: any[]) => any>(
  fn: T
): T {
  return cache(fn) as T;
}
