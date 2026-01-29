import { describe, expect, it } from 'vitest';

import { setupMSW } from '@/app/lib/test-utils/setup-msw';

setupMSW();

describe('MSW guard handlers', () => {
  it('fails reviewer-coordination lifecycle field requests even when operationName is omitted', async () => {
    const res = await fetch('http://example.test/graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        // operationName intentionally omitted to exercise deriveOperationName(query, null).
        query: 'query ReviewQueue { reviewQueue { reviewedAt } }',
        variables: {},
      }),
    });

    expect(res.ok).toBe(false);
    expect(res.status).toBe(500);

    const bodyText = await res.text();
    expect(bodyText).toMatch(/\[MSW guard\]/i);
  });
});

