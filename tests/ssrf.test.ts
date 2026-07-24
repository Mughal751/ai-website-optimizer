import { describe, it, expect } from 'vitest';
import { isBlockedIp, assertSafeUrl, SsrfValidationError } from '@/lib/ssrf';

describe('isBlockedIp', () => {
  it('blocks private IPv4 ranges', () => {
    expect(isBlockedIp('10.0.0.1')).toBe(true);
    expect(isBlockedIp('172.16.5.4')).toBe(true);
    expect(isBlockedIp('192.168.1.1')).toBe(true);
  });

  it('blocks loopback', () => {
    expect(isBlockedIp('127.0.0.1')).toBe(true);
    expect(isBlockedIp('::1')).toBe(true);
  });

  it('blocks link-local', () => {
    expect(isBlockedIp('169.254.1.1')).toBe(true);
    expect(isBlockedIp('fe80::1')).toBe(true);
  });

  it('blocks IPv4-mapped IPv6 private addresses', () => {
    expect(isBlockedIp('::ffff:127.0.0.1')).toBe(true);
    expect(isBlockedIp('::ffff:10.0.0.5')).toBe(true);
  });

  it('allows a plausible public IPv4 address', () => {
    expect(isBlockedIp('93.184.216.34')).toBe(false); // example.com's old address
  });

  it('allows a plausible public IPv6 address', () => {
    expect(isBlockedIp('2606:2800:220:1:248:1893:25c8:1946')).toBe(false);
  });
});

describe('assertSafeUrl', () => {
  it('rejects non-http(s) schemes', async () => {
    await expect(assertSafeUrl('ftp://example.com')).rejects.toThrow(SsrfValidationError);
    await expect(assertSafeUrl('file:///etc/passwd')).rejects.toThrow(SsrfValidationError);
  });

  it('rejects invalid URLs', async () => {
    await expect(assertSafeUrl('not a url')).rejects.toThrow(SsrfValidationError);
  });

  it('rejects URLs with embedded credentials', async () => {
    await expect(assertSafeUrl('https://user:pass@example.com')).rejects.toThrow(SsrfValidationError);
  });

  it('rejects a literal private IP target immediately, without DNS', async () => {
    await expect(assertSafeUrl('http://127.0.0.1/admin')).rejects.toThrow(SsrfValidationError);
    await expect(assertSafeUrl('http://192.168.1.1')).rejects.toThrow(SsrfValidationError);
  });

  it('rejects localhost by name', async () => {
    await expect(assertSafeUrl('http://localhost:3000')).rejects.toThrow(SsrfValidationError);
  });

  it('accepts a literal public IP target', async () => {
    const url = await assertSafeUrl('https://93.184.216.34');
    expect(url.hostname).toBe('93.184.216.34');
  });
});
