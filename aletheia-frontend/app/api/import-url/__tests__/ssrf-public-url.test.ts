import dns from 'node:dns/promises';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  assertPublicHttpUrlForServerFetch,
  resolvePublicHttpFetchTarget,
} from '../ssrf-public-url';

afterEach(() => {
  vi.restoreAllMocks();
});

function mockLookupAll(records: Array<{ address: string; family: 4 | 6 }>) {
  return vi
    .spyOn(
      dns as unknown as { lookup: (...args: unknown[]) => Promise<unknown> },
      'lookup',
    )
    .mockResolvedValue(records);
}

describe('assertPublicHttpUrlForServerFetch', () => {
  it('rejects non-http(s) schemes', async () => {
    await expect(assertPublicHttpUrlForServerFetch('file:///etc/passwd')).rejects.toThrow(
      'Only http(s) URLs are allowed',
    );
  });

  it('rejects URLs with credentials', async () => {
    await expect(assertPublicHttpUrlForServerFetch('http://user:pass@example.com/')).rejects.toThrow(
      'URLs with credentials are not allowed',
    );
  });

  it('rejects loopback IPv4 literal', async () => {
    await expect(assertPublicHttpUrlForServerFetch('http://127.0.0.1/')).rejects.toThrow(
      'This host is not allowed',
    );
  });

  it('rejects metadata / link-local IPv4 literal', async () => {
    await expect(assertPublicHttpUrlForServerFetch('http://169.254.169.254/')).rejects.toThrow(
      'This host is not allowed',
    );
  });

  it('rejects RFC1918 IPv4 literal', async () => {
    await expect(assertPublicHttpUrlForServerFetch('http://10.0.0.1/')).rejects.toThrow(
      'This host is not allowed',
    );
  });

  it('allows a public IPv4 literal', async () => {
    const u = await assertPublicHttpUrlForServerFetch('http://1.1.1.1/');
    expect(u.hostname).toBe('1.1.1.1');
  });

  it('returns the vetted connect target for hostnames', async () => {
    mockLookupAll([
      { address: '93.184.216.34', family: 4 },
      { address: '2606:2800:220:1:248:1893:25c8:1946', family: 6 },
    ]);

    const target = await resolvePublicHttpFetchTarget('https://example.com/path?q=1');

    expect(target.url.toString()).toBe('https://example.com/path?q=1');
    expect(target.address).toBe('93.184.216.34');
    expect(target.family).toBe(4);
  });

  it('rejects hostnames when any resolved address is blocked', async () => {
    mockLookupAll([
      { address: '93.184.216.34', family: 4 },
      { address: '127.0.0.1', family: 4 },
    ]);

    await expect(resolvePublicHttpFetchTarget('https://example.com/')).rejects.toThrow(
      'This host is not allowed',
    );
  });
});
