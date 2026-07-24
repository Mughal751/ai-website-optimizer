import type { Browser } from 'puppeteer-core';
import { AxePuppeteer } from '@axe-core/puppeteer';
import type { AccessibilityResult, Finding } from '@/types/scan';

export async function runAccessibilityCheck(url: string, browser: Browser): Promise<AccessibilityResult> {
  const findings: Finding[] = [];

  try {
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(20000);
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Real WCAG audit via axe-core, not a hand-rolled alt-text-only check.
    const results = await new AxePuppeteer(page as any).analyze();
    await page.close();

    const violations = results.violations.map((v) => ({
      id: v.id,
      impact: v.impact ?? null,
      description: v.description,
      nodes: v.nodes.length
    }));

    for (const v of violations) {
      findings.push({
        id: `accessibility.${v.id}`,
        category: 'accessibility',
        message: `${v.description} (${v.nodes} element${v.nodes === 1 ? '' : 's'} affected)`,
        severity: mapAxeImpact(v.impact)
      });
    }

    return { violations, findings };
  } catch (err) {
    findings.push({
      id: 'accessibility.check-error',
      category: 'accessibility',
      message: `Accessibility check failed: ${(err as Error).message}`,
      severity: 'Medium'
    });
    return { violations: [], findings };
  }
}

function mapAxeImpact(impact: string | null): Finding['severity'] {
  if (impact === 'critical' || impact === 'serious') return 'High';
  if (impact === 'moderate') return 'Medium';
  return 'Low';
}
