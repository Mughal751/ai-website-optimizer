import { assertSafeUrl, assertSafeRedirect, SsrfValidationError } from './ssrf';

export interface SafeFetchOptions {
  method?: 'GET' | 'HEAD';
  timeoutMs?: number;
  maxRedirects?: number;
  headers?: Record<string, string>;
}

export interface SafeFetchResult {
  response: Response | null;
  finalUrl: string;
  error?: string;
}

/**
 * Fetches a URL manually following redirects one hop at a time, re-running
 * SSRF validation on every hop (a public URL can redirect to an internal
 * address). Never uses fetch's built-in `redirect: "follow"`, since that
 * would bypass revalidation.
 */
export async function safeFetch(rawUrl: string, opts: SafeFetchOptions = {}): Promise<SafeFetchResult> {
  const { method = 'GET', timeoutMs = 10000, maxRedirects = 5, headers = {} } = opts;

  let currentUrl: URL;
  try {
    currentUrl = await assertSafeUrl(rawUrl);
  } catch (err) {
    return { response: null, finalUrl: rawUrl, error: (err as Error).message };
  }

  for (let hop = 0; hop <= maxRedirects; hop++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let res: Response;
    try {
      res = await fetch(currentUrl.toString(), {
        method,
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          'User-Agent': 'AIWebsiteOptimizer/1.0 (+https://example.com/bot)',
          ...headers
        }
      });
    } catch (err) {
      clearTimeout(timer);
      const msg = err instanceof Error && err.name === 'AbortError' ? 'Request timed out' : (err as Error).message;
      return { response: null, finalUrl: currentUrl.toString(), error: msg };
    }
    clearTimeout(timer);

    const isRedirect = res.status >= 300 && res.status < 400;
    const location = res.headers.get('location');

    if (isRedirect && location) {
      try {
        currentUrl = await assertSafeRedirect(location, currentUrl);
      } catch (err) {
        return {
          response: null,
          finalUrl: currentUrl.toString(),
          error: err instanceof SsrfValidationError ? err.message : 'Unsafe redirect target'
        };
      }
      continue;
    }

    return { response: res, finalUrl: currentUrl.toString() };
  }

  return { response: null, finalUrl: currentUrl.toString(), error: 'Too many redirects' };
}
