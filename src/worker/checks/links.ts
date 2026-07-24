import * as cheerio from 'cheerio';
import { safeFetch } from '@/lib/safeFetch';
import type { Finding, LinkCheckResult, LinksResult } from '@/types/scan';

const MAX_LINKS = 75;
const CONCURRENCY = 8;
const PER_LINK_TIMEOUT_MS = 8000;

export async function runLinksCheck(url: string): Promise<LinksResult> {
  const findings: Finding[] = [];
  const { response, finalUrl, error } = await safeFetch(url, { method: 'GET', timeoutMs: 15000 });

  if (!response) {
    findings.push({
      id: 'links.fetch-failed',
      category: 'links',
      message: `Could not fetch the page to extract links: ${error ?? 'unknown error'}`,
      severity: 'High'
    });
    return { totalFound: 0, totalChecked: 0, broken: [], findings };
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const base = new URL(finalUrl);

  const rawHrefs = $('a[href]')
    .map((_, el) => $(el).attr('href'))
    .get()
    .filter((href): href is string => !!href);

  const resolved = new Set<string>();
  for (const href of rawHrefs) {
    if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:') || href.startsWith('#')) {
      continue;
    }
    try {
      const abs = new URL(href, base);
      if (abs.protocol !== 'http:' && abs.protocol !== 'https:') continue;
      abs.hash = ''; // dedupe fragment-only variants
      resolved.add(abs.toString());
    } catch {
      // Not a resolvable URL — skip it.
    }
  }

  const totalFound = resolved.size;
  const toCheck = Array.from(resolved).slice(0, MAX_LINKS);

  const results: LinkCheckResult[] = [];
  let idx = 0;
  async function worker() {
    while (idx < toCheck.length) {
      const myIdx = idx++;
      const link = toCheck[myIdx];
      results[myIdx] = await checkOneLink(link);
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, toCheck.length) }, () => worker()));

  const broken = results.filter((r) => !r.ok);

  if (broken.length > 0) {
    findings.push({
      id: 'links.broken-found',
      category: 'links',
      message: `${broken.length} of ${results.length} checked links appear broken`,
      severity: broken.length > 5 ? 'High' : 'Medium',
      detail: { brokenLinks: broken.slice(0, 20) }
    });
  }

  return { totalFound, totalChecked: results.length, broken, findings };
}

async function checkOneLink(link: string): Promise<LinkCheckResult> {
  // Try HEAD first (cheaper); some servers reject HEAD, so fall back to GET.
  let { response, error } = await safeFetch(link, { method: 'HEAD', timeoutMs: PER_LINK_TIMEOUT_MS });

  if (!response || response.status === 405 || response.status === 501) {
    const getResult = await safeFetch(link, { method: 'GET', timeoutMs: PER_LINK_TIMEOUT_MS });
    response = getResult.response;
    error = getResult.error;
  }

  if (!response) {
    return { url: link, status: null, ok: false, error: error ?? 'Request failed' };
  }

  return { url: link, status: response.status, ok: response.status < 400 };
}
