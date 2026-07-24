import { safeFetch } from '@/lib/safeFetch';
import type { Finding, SecurityResult } from '@/types/scan';

const REQUIRED_HEADERS = [
  'content-security-policy',
  'strict-transport-security',
  'x-frame-options',
  'x-content-type-options',
  'referrer-policy',
  'permissions-policy'
];

export async function runSecurityCheck(url: string): Promise<SecurityResult> {
  const findings: Finding[] = [];
  const { response, finalUrl, error } = await safeFetch(url, { method: 'GET', timeoutMs: 15000 });

  if (!response) {
    findings.push({
      id: 'security.fetch-failed',
      category: 'security',
      message: `Could not reach the site to inspect headers: ${error ?? 'unknown error'}`,
      severity: 'High'
    });
    return {
      https: false,
      headers: {},
      missingHeaders: REQUIRED_HEADERS,
      mixedContent: false,
      findings
    };
  }

  const https = finalUrl.startsWith('https://');
  if (!https) {
    findings.push({
      id: 'security.no-https',
      category: 'security',
      message: 'Site is not served over HTTPS',
      severity: 'High'
    });
  }

  const headers: Record<string, string | null> = {};
  const missingHeaders: string[] = [];

  for (const h of REQUIRED_HEADERS) {
    const value = response.headers.get(h);
    headers[h] = value;
    if (!value) {
      missingHeaders.push(h);
      findings.push({
        id: `security.missing-${h}`,
        category: 'security',
        message: `Missing ${headerDisplayName(h)} header`,
        severity: h === 'content-security-policy' || h === 'strict-transport-security' ? 'High' : 'Medium'
      });
    }
  }

  if (https && !headers['strict-transport-security']) {
    findings.push({
      id: 'security.no-hsts',
      category: 'security',
      message: 'HTTPS is used but HSTS is not enforced, so a first visit over HTTP is not upgraded automatically',
      severity: 'Medium'
    });
  }

  // Mixed content: scan the HTML body (if present) for http:// asset references on an https page.
  let mixedContent = false;
  if (https) {
    try {
      const body = await response.clone().text();
      mixedContent = /(?:src|href)=["']http:\/\/[^"']+["']/i.test(body);
      if (mixedContent) {
        findings.push({
          id: 'security.mixed-content',
          category: 'security',
          message: 'Page loaded over HTTPS references resources over plain HTTP',
          severity: 'Medium'
        });
      }
    } catch {
      // Body already consumed or not text — skip mixed content check.
    }
  }

  return { https, headers, missingHeaders, mixedContent, findings };
}

function headerDisplayName(h: string): string {
  return h
    .split('-')
    .map((p) => p[0].toUpperCase() + p.slice(1))
    .join('-');
}
