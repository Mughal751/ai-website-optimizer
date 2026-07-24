import type { Browser } from 'puppeteer-core';
import { REMOTE_DEBUGGING_PORT } from '@/lib/browser';
import type { Finding, MobileResult } from '@/types/scan';

export async function runMobileCheck(url: string, browser: Browser): Promise<MobileResult> {
  const findings: Finding[] = [];
  let desktopScreenshot: string | null = null;
  let mobileScreenshot: string | null = null;
  let viewportMetaPresent = false;

  try {
    // Desktop viewport screenshot
    const desktopPage = await browser.newPage();
    await desktopPage.setViewport({ width: 1440, height: 900 });
    await desktopPage.setDefaultNavigationTimeout(20000);
    await desktopPage.goto(url, { waitUntil: 'networkidle2' });
    const desktopBuf = await desktopPage.screenshot({ type: 'jpeg', quality: 60 });
    desktopScreenshot = Buffer.from(desktopBuf).toString('base64');

    viewportMetaPresent = await desktopPage.evaluate(() => {
      return !!document.querySelector('meta[name="viewport"]');
    });
    await desktopPage.close();

    // Mobile viewport screenshot
    const mobilePage = await browser.newPage();
    await mobilePage.setViewport({ width: 375, height: 667, isMobile: true, hasTouch: true });
    await mobilePage.setDefaultNavigationTimeout(20000);
    await mobilePage.goto(url, { waitUntil: 'networkidle2' });
    const mobileBuf = await mobilePage.screenshot({ type: 'jpeg', quality: 60 });
    mobileScreenshot = Buffer.from(mobileBuf).toString('base64');
    await mobilePage.close();

    if (!viewportMetaPresent) {
      findings.push({
        id: 'mobile.no-viewport-meta',
        category: 'mobile',
        message: 'Page is missing a <meta name="viewport"> tag',
        severity: 'High'
      });
    }
  } catch (err) {
    findings.push({
      id: 'mobile.screenshot-error',
      category: 'mobile',
      message: `Mobile rendering check failed: ${(err as Error).message}`,
      severity: 'Medium'
    });
  }

  // Tap-target sizing, pulled from a targeted Lighthouse audit run against
  // the same shared Chrome instance via its remote-debugging port.
  let tapTargetIssues = 0;
  try {
    const lighthouse = (await import('lighthouse')).default;
    const runnerResult = await lighthouse(url, {
      port: REMOTE_DEBUGGING_PORT,
      output: 'json',
      onlyAudits: ['tap-targets'],
      formFactor: 'mobile',
      screenEmulation: { mobile: true, width: 375, height: 667, deviceScaleFactor: 2, disabled: false }
    });

    const tapTargetsAudit = runnerResult?.lhr.audits['tap-targets'];
    if (tapTargetsAudit && tapTargetsAudit.score !== null && tapTargetsAudit.score < 1) {
      const details = tapTargetsAudit.details as { items?: unknown[] } | undefined;
      tapTargetIssues = details?.items?.length ?? 0;
      if (tapTargetIssues > 0) {
        findings.push({
          id: 'mobile.tap-target-sizing',
          category: 'mobile',
          message: `${tapTargetIssues} tap target${tapTargetIssues === 1 ? '' : 's'} too small or too close together`,
          severity: tapTargetIssues > 5 ? 'High' : 'Medium'
        });
      }
    }
  } catch (err) {
    findings.push({
      id: 'mobile.tap-target-check-error',
      category: 'mobile',
      message: `Tap-target audit failed: ${(err as Error).message}`,
      severity: 'Low'
    });
  }

  return { viewportMetaPresent, desktopScreenshot, mobileScreenshot, tapTargetIssues, findings };
}
