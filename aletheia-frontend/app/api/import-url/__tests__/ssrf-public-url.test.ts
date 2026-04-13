import { describe, expect, it } from 'vitest';

import { assertPublicHttpUrlForServerFetch } from '../ssrf-public-url';

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

  it('rejects IPv4-mapped ::ffff loopback', async () => {
    await expect(assertPublicHttpUrlForServerFetch('http://[::ffff:127.0.0.1]/')).rejects.toThrow(
      'This host is not allowed',
    );
  });

  it('allows a public IPv4 literal', async () => {
    const u = await assertPublicHttpUrlForServerFetch('http://1.1.1.1/');
    expect(u.hostname).toBe('1.1.1.1');
  });
});
