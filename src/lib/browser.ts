import type { Browser } from 'puppeteer-core';

// A fixed remote-debugging port lets Lighthouse attach to the same Chrome
// instance Puppeteer launched, instead of Lighthouse spawning its own
// (which is what chrome-launcher did, and which doesn't work in a
// serverless function — there's no chrome-launcher-managed binary there).
export const REMOTE_DEBUGGING_PORT = 9222;

const IS_SERVERLESS = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;

/**
 * Launches one headless Chrome instance for the whole scan pipeline to
 * share. On Vercel (or any Lambda-style serverless runtime) this uses
 * puppeteer-core + @sparticuz/chromium, a slim Chromium build within the
 * function bundle size limit. Locally it uses full puppeteer's bundled
 * Chrome, which is much simpler for development.
 *
 * Reusing a single browser across all checks in a scan (rather than each
 * check launching its own) matters for staying inside Vercel's function
 * duration budget — Chrome cold starts are the single slowest part of
 * each check.
 */
export async function launchSharedBrowser(): Promise<Browser> {
  if (IS_SERVERLESS) {
    const chromium = (await import('@sparticuz/chromium')).default;
    const puppeteerCore = await import('puppeteer-core');
    const executablePath = await chromium.executablePath();

    return puppeteerCore.launch({
      args: [...chromium.args, `--remote-debugging-port=${REMOTE_DEBUGGING_PORT}`],
      executablePath,
      headless: true
    }) as unknown as Promise<Browser>;
  }

  // Local dev / Docker: full puppeteer package, optionally pointed at a
  // system-installed Chromium via PUPPETEER_EXECUTABLE_PATH (set in
  // Dockerfile.web) so the image doesn't also need to bundle Puppeteer's
  // own Chromium download. Cast through unknown because puppeteer's
  // Browser type and puppeteer-core's Browser type are structurally
  // compatible but declared in separate packages.
  const puppeteer = (await import('puppeteer')).default;
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      `--remote-debugging-port=${REMOTE_DEBUGGING_PORT}`
    ]
  });
  return browser as unknown as Browser;
}
