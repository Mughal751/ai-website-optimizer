/**
 * Normalizes user-submitted URL input: trims whitespace, adds https:// if
 * no scheme was given, and lowercases the hostname. Does NOT perform SSRF
 * checks — see lib/ssrf.ts for that, which must always run after this.
 */
export function normalizeUrl(input: string): string {
  let trimmed = input.trim();
  if (!trimmed) throw new Error('URL is required');

  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }

  const url = new URL(trimmed); // throws if still invalid
  url.hostname = url.hostname.toLowerCase();
  // Strip default ports for consistency.
  if (
    (url.protocol === 'https:' && url.port === '443') ||
    (url.protocol === 'http:' && url.port === '80')
  ) {
    url.port = '';
  }
  return url.toString();
}
