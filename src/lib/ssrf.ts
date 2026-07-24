import dns from 'node:dns/promises';
import net from 'node:net';

export class SsrfValidationError extends Error {}

/**
 * IPv4 ranges considered private/internal and disallowed as scan targets.
 * Each entry is [network, prefixLength].
 */
const BLOCKED_V4_RANGES: Array<[string, number]> = [
  ['10.0.0.0', 8],
  ['172.16.0.0', 12],
  ['192.168.0.0', 16],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['0.0.0.0', 8],
  ['100.64.0.0', 10], // carrier-grade NAT
  ['192.0.0.0', 24],
  ['198.18.0.0', 15],
  ['224.0.0.0', 4] // multicast
];

function ipv4ToInt(ip: string): number {
  return ip
    .split('.')
    .reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

function isBlockedIPv4(ip: string): boolean {
  const ipInt = ipv4ToInt(ip);
  return BLOCKED_V4_RANGES.some(([network, prefix]) => {
    const networkInt = ipv4ToInt(network);
    const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
    return (ipInt & mask) === (networkInt & mask);
  });
}

function isBlockedIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase();
  return (
    normalized === '::1' || // loopback
    normalized.startsWith('fe80:') || // link-local
    normalized.startsWith('fc') || // unique local fc00::/7
    normalized.startsWith('fd') ||
    normalized === '::' ||
    normalized.startsWith('::ffff:127.') || // IPv4-mapped loopback
    normalized.startsWith('::ffff:10.') ||
    normalized.startsWith('::ffff:192.168.') ||
    normalized.startsWith('::ffff:169.254.')
  );
}

export function isBlockedIp(ip: string): boolean {
  if (net.isIPv4(ip)) return isBlockedIPv4(ip);
  if (net.isIPv6(ip)) return isBlockedIPv6(ip);
  // Unknown format — fail closed.
  return true;
}

/**
 * Validates a URL is safe to fetch server-side:
 * - http(s) scheme only
 * - hostname resolves to at least one address
 * - none of the resolved addresses are private/loopback/link-local
 *
 * Call this again after following each redirect hop, since a public
 * hostname can redirect to an internal address.
 */
export async function assertSafeUrl(rawUrl: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new SsrfValidationError('Invalid URL');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new SsrfValidationError('Only http and https URLs are allowed');
  }

  // Reject credentials embedded in the URL (user:pass@host) — not an SSRF
  // vector per se, but not something we want to carry through a crawler.
  if (parsed.username || parsed.password) {
    throw new SsrfValidationError('URLs with embedded credentials are not allowed');
  }

  const hostname = parsed.hostname;

  // Literal IP in the URL — validate directly.
  if (net.isIP(hostname)) {
    if (isBlockedIp(hostname)) {
      throw new SsrfValidationError('Target IP address is not allowed');
    }
    return parsed;
  }

  if (hostname === 'localhost') {
    throw new SsrfValidationError('localhost is not allowed');
  }

  let addresses: string[];
  try {
    const results = await dns.lookup(hostname, { all: true, verbatim: true });
    addresses = results.map((r) => r.address);
  } catch {
    throw new SsrfValidationError('Could not resolve hostname');
  }

  if (addresses.length === 0) {
    throw new SsrfValidationError('Hostname did not resolve to any address');
  }

  for (const addr of addresses) {
    if (isBlockedIp(addr)) {
      throw new SsrfValidationError(
        'Target hostname resolves to a private or reserved IP address'
      );
    }
  }

  return parsed;
}

/**
 * Wraps assertSafeUrl for use before following a redirect: re-validates
 * the redirect target the same way the original URL was validated.
 */
export async function assertSafeRedirect(location: string, base: URL): Promise<URL> {
  const resolved = new URL(location, base);
  return assertSafeUrl(resolved.toString());
}
