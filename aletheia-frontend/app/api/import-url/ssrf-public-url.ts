/**
 * SSRF guard for server-side fetch of user-supplied URLs: block non–globally-routable
 * addresses (RFC1918, loopback, link-local, CGNAT, metadata, multicast, etc.) using
 * resolved IPs plus {@link https://nodejs.org/api/net.html#class-netblocklist BlockList}.
 */
import type { LookupAddress } from 'node:dns';
import dns from 'node:dns/promises';
import { BlockList, isIP } from 'node:net';

const ssrfBlocklist = new BlockList();

// IPv4
ssrfBlocklist.addSubnet('0.0.0.0', 8, 'ipv4');
ssrfBlocklist.addSubnet('10.0.0.0', 8, 'ipv4');
ssrfBlocklist.addSubnet('127.0.0.0', 8, 'ipv4');
ssrfBlocklist.addSubnet('169.254.0.0', 16, 'ipv4');
ssrfBlocklist.addSubnet('172.16.0.0', 12, 'ipv4');
ssrfBlocklist.addSubnet('192.168.0.0', 16, 'ipv4');
ssrfBlocklist.addSubnet('100.64.0.0', 10, 'ipv4');
ssrfBlocklist.addSubnet('192.0.0.0', 24, 'ipv4');
ssrfBlocklist.addSubnet('192.0.2.0', 24, 'ipv4');
ssrfBlocklist.addSubnet('198.18.0.0', 15, 'ipv4');
ssrfBlocklist.addSubnet('198.51.100.0', 24, 'ipv4');
ssrfBlocklist.addSubnet('203.0.113.0', 24, 'ipv4');
ssrfBlocklist.addSubnet('224.0.0.0', 4, 'ipv4');
ssrfBlocklist.addSubnet('240.0.0.0', 4, 'ipv4');

// IPv6
ssrfBlocklist.addAddress('::1', 'ipv6');
ssrfBlocklist.addSubnet('fe80::', 10, 'ipv6');
ssrfBlocklist.addSubnet('fc00::', 7, 'ipv6');
ssrfBlocklist.addSubnet('ff00::', 8, 'ipv6');

function isBlockedIpString(ip: string): boolean {
  const v = isIP(ip);
  if (v === 0) return true;
  const type = v === 4 ? 'ipv4' : 'ipv6';
  if (ssrfBlocklist.check(ip, type)) return true;
  if (v === 6 && ip.toLowerCase().startsWith('::ffff:')) {
    const embedded = ip.slice(7);
    if (isIP(embedded) === 4 && ssrfBlocklist.check(embedded, 'ipv4')) return true;
  }
  return false;
}

function assertUrlShape(u: URL): void {
  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    throw new Error('Only http(s) URLs are allowed');
  }
  if (u.username !== '' || u.password !== '') {
    throw new Error('URLs with credentials are not allowed');
  }
  const host = u.hostname.toLowerCase();
  if (!host || host.includes('%')) {
    throw new Error('Invalid host');
  }
  if (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '0.0.0.0' ||
    host === '[::1]' ||
    host === '::1' ||
    host.endsWith('.localhost')
  ) {
    throw new Error('This host is not allowed');
  }
}

/**
 * Ensures the URL uses http(s), has no credentials, and resolves only to
 * addresses not blocked by {@link ssrfBlocklist} (every resolved address must pass).
 */
export async function assertPublicHttpUrlForServerFetch(urlString: string): Promise<URL> {
  let u: URL;
  try {
    u = new URL(urlString);
  } catch {
    throw new Error('Invalid URL');
  }
  assertUrlShape(u);

  const host = u.hostname;
  const ipVer = isIP(host);
  if (ipVer === 4 || ipVer === 6) {
    if (isBlockedIpString(host)) {
      throw new Error('This host is not allowed');
    }
    return u;
  }

  let records: LookupAddress[];
  try {
    records = await dns.lookup(host, { all: true });
  } catch {
    throw new Error('Could not resolve host');
  }
  if (!records.length) {
    throw new Error('Could not resolve host');
  }
  for (const { address } of records) {
    if (isBlockedIpString(address)) {
      throw new Error('This host is not allowed');
    }
  }
  return u;
}
