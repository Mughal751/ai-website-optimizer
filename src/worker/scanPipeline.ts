import { runSecurityCheck } from './checks/security';
import { runSeoCheck } from './checks/seo';
import { runLinksCheck } from './checks/links';
import { runPerformanceCheck } from './checks/performance';
import { runAccessibilityCheck } from './checks/accessibility';
import { runMobileCheck } from './checks/mobile';
import { computeCategoryScores, computeOverallScore } from './scoring';
import { buildRecommendations } from './recommendations';
import { launchSharedBrowser } from '@/lib/browser';
import type { RawResults, Recommendation, CategoryScores } from '@/types/scan';

export interface PipelineResult {
  overallScore: number;
  categoryScores: CategoryScores;
  rawResults: RawResults;
  recommendations: Recommendation[];
}

/**
 * Runs every real check against the URL and turns the results into scores
 * and recommendations. The three checks that need headless Chrome
 * (performance, accessibility, mobile) share a single browser instance,
 * launched once here — this matters on Vercel, where each Chrome cold
 * start eats into the function's duration budget. The non-browser checks
 * (security, seo, links) run in parallel alongside the browser launch.
 *
 * IMPORTANT: performance/accessibility/mobile run SEQUENTIALLY, not in
 * parallel, even though they share one browser. Lighthouse always takes
 * exclusive control of page navigation on whatever target it's pointed
 * at (https://github.com/GoogleChrome/lighthouse/issues/3837) — running
 * it concurrently with Puppeteer opening/navigating other pages on the
 * same browser causes a "start lh:runner:gather" race condition and
 * Lighthouse fails outright. Running them one at a time is slightly
 * slower but reliable, and avoids every scan showing the same generic
 * "Performance check failed" finding regardless of the target site.
 */
export async function runScanPipeline(url: string): Promise<PipelineResult> {
  const browserPromise = launchSharedBrowser();

  const [security, seo, links] = await Promise.all([
    runSecurityCheck(url),
    runSeoCheck(url),
    runLinksCheck(url)
  ]);

  const browser = await browserPromise;
  let performance, accessibility, mobile;
  try {
    performance = await runPerformanceCheck(url, browser);
    accessibility = await runAccessibilityCheck(url, browser);
    mobile = await runMobileCheck(url, browser);
  } finally {
    await browser.close();
  }

  const rawResults: RawResults = { security, seo, links, performance, accessibility, mobile };

  const categoryScores = computeCategoryScores(
    {
      seo: seo.findings,
      performance: performance.findings,
      accessibility: accessibility.findings,
      mobile: mobile.findings,
      security: security.findings,
      links: links.findings
    },
    performance
  );

  const overallScore = computeOverallScore(categoryScores);

  const allFindings = [
    ...security.findings,
    ...seo.findings,
    ...links.findings,
    ...performance.findings,
    ...accessibility.findings,
    ...mobile.findings
  ];

  const recommendations = buildRecommendations(allFindings);

  return { overallScore, categoryScores, rawResults, recommendations };
}