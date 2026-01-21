'use client';

import { useEffect, useState } from 'react';

/**
 * Starts MSW in the browser during development.
 *
 * This makes the dev server backend-independent and enforces the "MSW as source of truth" rule.
 */
export function MSWProvider({ children }: { children: React.ReactNode }) {
  const shouldStart =
    process.env.NEXT_PUBLIC_MSW === 'enabled' || process.env.NODE_ENV === 'development';
  const [ready, setReady] = useState(!shouldStart);

  useEffect(() => {
    if (!shouldStart) return;

    let cancelled = false;
    void (async () => {
      const { worker } = await import('../lib/test-utils/browser');
      await worker.start({
        onUnhandledRequest(req, print) {
          // Explicitly fail in dev if UI hits an unmocked endpoint.
          // This matches the test-time strictness in `setupTests.ts`.
          print.error();
          throw new Error(`[MSW] Unhandled request: ${req.method} ${String(req.url)}`);
        },
      });
      if (!cancelled) setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Avoid rendering components that would hit the network before MSW is ready.
  if (!ready) return null;

  return children;
}

