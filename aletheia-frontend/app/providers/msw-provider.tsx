'use client';

import { useEffect, useState } from 'react';

/**
 * Starts MSW in the browser during development.
 *
 * This makes the dev server backend-independent and enforces the "MSW as source of truth" rule.
 */
export function MSWProvider({ children }: { children: React.ReactNode }) {
  const shouldStart =
    process.env.NEXT_PUBLIC_MSW !== 'disabled' &&
    (process.env.NEXT_PUBLIC_MSW === 'enabled' || process.env.NODE_ENV === 'development');
  const [ready, setReady] = useState(!shouldStart);

  useEffect(() => {
    if (!shouldStart) return;

    let cancelled = false;
    void (async () => {
      const { worker } = await import('../lib/test-utils/browser');
      await worker.start({
        onUnhandledRequest(req, print) {
          const url = typeof req.url === 'string' ? new URL(req.url) : req.url;
          const pathname = url.pathname;

          // Next.js (Turbopack) may fetch internal assets (chunks, manifests, source maps) via `fetch`.
          // These are not API calls and should never be handled by MSW.
          if (pathname.startsWith('/_next/')) return;
          // Next.js App Router fetches RSC payloads from same-origin routes using `?_rsc=...`.
          // These are internal navigation requests and must not be treated as missing API mocks.
          if (url.searchParams.has('_rsc')) return;

          // Allow common static assets to pass through without failing dev.
          const destination = (req as Request).destination;
          const isAssetDestination =
            destination === 'script' ||
            destination === 'style' ||
            destination === 'image' ||
            destination === 'font';
          const isStaticFile = /\.[a-z0-9]+$/i.test(pathname);
          if (isAssetDestination || isStaticFile) return;

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
  }, [shouldStart]);

  // Avoid rendering components that would hit the network before MSW is ready.
  if (!ready) return null;

  return children;
}

