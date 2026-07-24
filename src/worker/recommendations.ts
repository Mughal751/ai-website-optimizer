import type { Finding, Recommendation, Effort } from '@/types/scan';

/**
 * Static metadata (why it matters / how to fix / effort) keyed by finding
 * id prefix. This is the rule-based baseline required by the brief -
 * every entry here only ever gets used when a matching real finding
 * exists; nothing is emitted for categories with no findings.
 */
interface FixInfo {
  effort: Effort;
  explanation: string;
  fixSteps: string[];
}

const FIX_LIBRARY: Record<string, FixInfo> = {
  'seo.missing-title': {
    effort: 'Quick win',
    explanation: 'The title tag is what shows in search results and browser tabs — without one, search engines have to guess what the page is about, which hurts click-through rate and rankings.',
    fixSteps: ['Add a unique, descriptive <title> tag to the page <head>.', 'Keep it between 10-60 characters and include the primary keyword near the front.']
  },
  'seo.title-length': {
    effort: 'Quick win',
    explanation: 'Titles outside the 10-60 character range often get truncated in search results or fail to convey enough context.',
    fixSteps: ['Rewrite the title to fall within roughly 10-60 characters while keeping it descriptive.']
  },
  'seo.missing-meta-description': {
    effort: 'Quick win',
    explanation: 'The meta description is often shown as the snippet under your search result — without one, search engines auto-generate a snippet that may not sell the page well.',
    fixSteps: ['Add a <meta name="description"> tag summarizing the page in 50-160 characters.']
  },
  'seo.meta-description-length': {
    effort: 'Quick win',
    explanation: 'Descriptions that are too short waste an opportunity to describe the page; too long ones get cut off in results.',
    fixSteps: ['Trim or expand the meta description to roughly 50-160 characters.']
  },
  'seo.no-h1': {
    effort: 'Quick win',
    explanation: 'The H1 tells both users and search engines the main topic of the page.',
    fixSteps: ['Add a single, descriptive <h1> that summarizes the page content.']
  },
  'seo.multiple-h1': {
    effort: 'Quick win',
    explanation: 'Multiple H1s can dilute the signal of what the page is primarily about and confuse assistive technology users navigating by heading.',
    fixSteps: ['Keep one <h1> per page and demote the others to <h2> or lower.']
  },
  'seo.heading-hierarchy': {
    effort: 'Larger fix',
    explanation: 'Skipping heading levels breaks the logical outline of the page, which especially affects screen reader users navigating by heading.',
    fixSteps: ['Restructure headings so levels increase by one at a time (H2 -> H3, not H2 -> H4).']
  },
  'seo.missing-canonical': {
    effort: 'Quick win',
    explanation: 'A canonical tag tells search engines which URL is the authoritative version, preventing duplicate-content issues.',
    fixSteps: ['Add a <link rel="canonical" href="..."> pointing to the preferred URL for this page.']
  },
  'seo.missing-robots': {
    effort: 'Quick win',
    explanation: 'robots.txt tells crawlers which parts of the site they can access, and is where your sitemap is typically declared.',
    fixSteps: ['Add a robots.txt file at the site root with at minimum a Sitemap: directive.']
  },
  'seo.missing-sitemap': {
    effort: 'Quick win',
    explanation: 'A sitemap helps search engines discover and index your pages efficiently, especially on larger sites.',
    fixSteps: ['Generate a sitemap.xml listing your indexable pages and reference it from robots.txt.']
  },
  'seo.incomplete-og': {
    effort: 'Quick win',
    explanation: 'Open Graph tags control how the page looks when shared on social platforms like Facebook and LinkedIn — without them, shares show a blank or generic preview.',
    fixSteps: ['Add the missing og:title, og:description, og:image, and og:url meta tags.']
  },
  'seo.missing-twitter-card': {
    effort: 'Quick win',
    explanation: 'Twitter/X card tags control how links look when shared on that platform.',
    fixSteps: ['Add twitter:card, twitter:title, and twitter:description meta tags.']
  },
  'seo.image-alt-coverage': {
    effort: 'Larger fix',
    explanation: 'Alt text helps search engines understand images and is essential for screen reader users; low coverage means both are missing context across the site.',
    fixSteps: ['Add descriptive alt attributes to all meaningful images.', 'Use empty alt="" only for purely decorative images.']
  },
  'seo.no-structured-data': {
    effort: 'Larger fix',
    explanation: 'JSON-LD structured data helps search engines display rich results (ratings, breadcrumbs, product info) which can improve click-through rate.',
    fixSteps: ['Add relevant JSON-LD structured data (e.g. Organization, Article, or Product schema) to the page.']
  },

  'performance.low-lighthouse-score': {
    effort: 'Larger fix',
    explanation: 'The Lighthouse performance score reflects real, measured page-load behavior — a low score means users are waiting longer than they should.',
    fixSteps: ['Review the detailed Lighthouse report for the specific opportunities (image sizing, unused JS/CSS, render-blocking resources).', 'Prioritize the highest-impact opportunities first.']
  },
  'performance.slow-lcp': {
    effort: 'Larger fix',
    explanation: 'Largest Contentful Paint measures when the main content becomes visible — slow LCP makes the site feel sluggish and hurts Core Web Vitals rankings.',
    fixSteps: ['Optimize and preload the largest above-the-fold image or text block.', 'Reduce server response time and eliminate render-blocking resources.']
  },
  'performance.high-cls': {
    effort: 'Larger fix',
    explanation: 'Cumulative Layout Shift measures unexpected visual movement — high CLS causes misclicks and a jarring user experience.',
    fixSteps: ['Set explicit width/height on images and embeds.', 'Avoid inserting content above existing content after load.']
  },

  'accessibility.default': {
    effort: 'Larger fix',
    explanation: 'This is a real WCAG violation detected by an automated accessibility audit, meaning some users relying on assistive technology cannot fully use this part of the page.',
    fixSteps: ['Review the flagged elements against the WCAG success criterion referenced by this rule.', 'Fix the underlying markup (e.g. add labels, fix contrast, add ARIA attributes) rather than suppressing the warning.']
  },

  'mobile.no-viewport-meta': {
    effort: 'Quick win',
    explanation: 'Without a viewport meta tag, mobile browsers render the page at desktop width and scale it down, making text unreadably small.',
    fixSteps: ['Add <meta name="viewport" content="width=device-width, initial-scale=1"> to the <head>.']
  },
  'mobile.tap-target-sizing': {
    effort: 'Larger fix',
    explanation: 'Tap targets that are too small or too close together are hard to tap accurately on a touchscreen, causing mis-taps and frustration.',
    fixSteps: ['Ensure interactive elements are at least 48x48px with adequate spacing from neighboring targets.']
  },

  'security.no-https': {
    effort: 'Larger fix',
    explanation: 'Without HTTPS, all traffic (including any forms) is unencrypted and can be intercepted or modified in transit.',
    fixSteps: ['Obtain a TLS certificate (e.g. via Let\'s Encrypt) and redirect all HTTP traffic to HTTPS.']
  },
  'security.no-hsts': {
    effort: 'Quick win',
    explanation: 'Without HSTS, a user\'s first request can still go out over plain HTTP before any redirect happens, leaving a brief window for interception.',
    fixSteps: ['Add a Strict-Transport-Security header with a long max-age once HTTPS is confirmed working sitewide.']
  },
  'security.mixed-content': {
    effort: 'Quick win',
    explanation: 'Loading any resource over HTTP on an HTTPS page undermines the encryption guarantee and triggers browser warnings.',
    fixSteps: ['Update all asset URLs (images, scripts, styles) to use https:// or protocol-relative paths.']
  },
  'security.missing-content-security-policy': {
    effort: 'Larger fix',
    explanation: 'A Content-Security-Policy header is one of the strongest defenses against cross-site scripting (XSS) attacks.',
    fixSteps: ['Define a CSP that allowlists only the script/style/image sources your site actually needs, starting in report-only mode.']
  },
  'security.missing-strict-transport-security': {
    effort: 'Quick win',
    explanation: 'HSTS instructs browsers to only ever connect over HTTPS, preventing downgrade attacks.',
    fixSteps: ['Add Strict-Transport-Security: max-age=31536000; includeSubDomains once HTTPS is fully working.']
  },
  'security.missing-x-frame-options': {
    effort: 'Quick win',
    explanation: 'Without this header, your site can be embedded in an invisible iframe on an attacker\'s page for clickjacking attacks.',
    fixSteps: ['Add X-Frame-Options: DENY or SAMEORIGIN (or an equivalent frame-ancestors CSP directive).']
  },
  'security.missing-x-content-type-options': {
    effort: 'Quick win',
    explanation: 'Without this header, some browsers will try to guess ("sniff") a resource\'s type, which can be exploited to execute disguised scripts.',
    fixSteps: ['Add X-Content-Type-Options: nosniff.']
  },
  'security.missing-referrer-policy': {
    effort: 'Quick win',
    explanation: 'Without a Referrer-Policy, full URLs (which may include sensitive query params) can leak to third-party sites via the Referer header.',
    fixSteps: ['Add a Referrer-Policy such as strict-origin-when-cross-origin.']
  },
  'security.missing-permissions-policy': {
    effort: 'Quick win',
    explanation: 'Permissions-Policy restricts which browser features (camera, mic, geolocation) can be used, reducing the impact of any injected script.',
    fixSteps: ['Add a Permissions-Policy header disabling features the site does not use.']
  },

  'links.broken-found': {
    effort: 'Larger fix',
    explanation: 'Broken links create dead ends for users and waste crawl budget for search engines, and can be a signal of an unmaintained site.',
    fixSteps: ['Update or remove each broken link.', 'Set up periodic link checking to catch new breakage early.']
  }
};

/**
 * Converts real detected findings into recommendations. Only ever
 * produces output for findings that actually occurred - no padding for
 * clean categories.
 */
export function buildRecommendations(allFindings: Finding[]): Recommendation[] {
  const recs: Recommendation[] = allFindings.map((finding) => {
    const info =
      FIX_LIBRARY[finding.id] ??
      (finding.category === 'accessibility' ? FIX_LIBRARY['accessibility.default'] : undefined) ??
      genericFallback(finding);

    return {
      category: finding.category,
      issue: finding.message,
      impact: finding.severity,
      effort: info.effort,
      explanation: info.explanation,
      fixSteps: info.fixSteps
    };
  });

  const impactOrder: Record<Recommendation['impact'], number> = { High: 0, Medium: 1, Low: 2 };
  return recs.sort((a, b) => impactOrder[a.impact] - impactOrder[b.impact]);
}

function genericFallback(finding: Finding): FixInfo {
  return {
    effort: 'Larger fix',
    explanation: `An issue was detected in the ${finding.category} category: ${finding.message}.`,
    fixSteps: ['Review the detailed findings for this category and address the specific issue reported.']
  };
}
