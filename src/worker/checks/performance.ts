import type { Browser } from 'puppeteer-core';
import { REMOTE_DEBUGGING_PORT } from '@/lib/browser';
import type { Finding, PerformanceResult } from '@/types/scan';

/**
 * Runs a real Lighthouse audit against the URL. Lighthouse attaches to the
 * shared Chrome instance (launched once per scan by lib/browser.ts) via its
 * remote-debugging port, rather than spawning its own Chrome the way
 * chrome-launcher did — chrome-launcher assumes a locally installed Chrome
 * binary it can manage directly, which doesn't exist in a serverless
 * function. The browser param is accepted for interface consistency with
 * the other browser-based checks even though Lighthouse talks to it only
 * via the debugging port, not the Puppeteer handle directly.
 */
export async function runPerformanceCheck(url: string, _browser: Browser): Promise<PerformanceResult> {
  const findings: Finding[] = [];

  try {
    const lighthouse = (await import('lighthouse')).default;

    const runnerResult = await lighthouse(url, {
      port: REMOTE_DEBUGGING_PORT,
      output: 'json',
      onlyCategories: ['performance'],
      formFactor: 'mobile',
      screenEmulation: { mobile: true, width: 375, height: 667, deviceScaleFactor: 2, disabled: false }
    });

    if (!runnerResult?.lhr) {
      findings.push({
        id: 'performance.lighthouse-failed',
        category: 'performance',
        message: 'Lighthouse did not return a report for this URL',
        severity: 'High'
      });
      return { lighthouseScore: null, lcpMs: null, clsScore: null, inpMs: null, findings };
    }

    const lhr = runnerResult.lhr;
    const perfScore = lhr.categories.performance?.score;
    const lighthouseScore = perfScore != null ? Math.round(perfScore * 100) : null;

    const lcpMs = lhr.audits['largest-contentful-paint']?.numericValue ?? null;
    const clsScore = lhr.audits['cumulative-layout-shift']?.numericValue ?? null;
    const inpMs =
      lhr.audits['interaction-to-next-paint']?.numericValue ??
      lhr.audits['total-blocking-time']?.numericValue ??
      null;

    if (lighthouseScore !== null && lighthouseScore < 90) {
      findings.push({
        id: 'performance.low-lighthouse-score',
        category: 'performance',
        message: `Lighthouse performance score is ${lighthouseScore}/100`,
        severity: lighthouseScore < 50 ? 'High' : 'Medium'
      });
    }
    if (lcpMs !== null && lcpMs > 2500) {
      findings.push({
        id: 'performance.slow-lcp',
        category: 'performance',
        message: `Largest Contentful Paint is ${Math.round(lcpMs)}ms (target under 2500ms)`,
        severity: lcpMs > 4000 ? 'High' : 'Medium'
      });
    }
    if (clsScore !== null && clsScore > 0.1) {
      findings.push({
        id: 'performance.high-cls',
        category: 'performance',
        message: `Cumulative Layout Shift is ${clsScore.toFixed(2)} (target under 0.1)`,
        severity: clsScore > 0.25 ? 'High' : 'Medium'
      });
    }

    return { lighthouseScore, lcpMs, clsScore, inpMs, findings };
  } catch (err) {
    findings.push({
      id: 'performance.check-error',
      category: 'performance',
      message: `Performance check failed: ${(err as Error).message}`,
      severity: 'Medium'
    });
    return { lighthouseScore: null, lcpMs: null, clsScore: null, inpMs: null, findings };
  }
}
