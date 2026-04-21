import { describe, expect, it } from 'vitest';

// MSW server is started in setupTests.ts; do not call setupMSW() here (double listen fails on MSW 2.13+).

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

  it('ADR-021: fails when similarity or graph metric fields are requested', async () => {
    const res = await fetch('http://example.test/graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query: 'query ListClaims { claims { id similarity } }',
        variables: {},
      }),
    });

    expect(res.ok).toBe(false);
    expect(res.status).toBe(500);
    const bodyText = await res.text();
    expect(bodyText).toMatch(/ADR-021/i);
    expect(bodyText).toMatch(/similarity/i);
  });
});

