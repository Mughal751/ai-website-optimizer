import * as cheerio from 'cheerio';
import { safeFetch } from '@/lib/safeFetch';
import type { Finding, SeoResult } from '@/types/scan';

export async function runSeoCheck(url: string): Promise<SeoResult> {
  const findings: Finding[] = [];
  const { response, finalUrl, error } = await safeFetch(url, { method: 'GET', timeoutMs: 15000 });

  const empty: SeoResult = {
    title: { present: false, length: 0, value: null },
    metaDescription: { present: false, length: 0, value: null },
    headings: { h1Count: 0, hasLogicalHierarchy: false },
    canonical: { present: false, value: null },
    robotsTxt: { present: false },
    sitemapXml: { present: false },
    openGraph: { present: false, missingTags: [] },
    twitterCard: { present: false, missingTags: [] },
    imageAltCoverage: { total: 0, withAlt: 0, percent: 100 },
    structuredData: { present: false, count: 0 },
    findings
  };

  if (!response) {
    findings.push({
      id: 'seo.fetch-failed',
      category: 'seo',
      message: `Could not fetch the page to analyze SEO: ${error ?? 'unknown error'}`,
      severity: 'High'
    });
    return empty;
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const origin = new URL(finalUrl).origin;

  // --- Title ---
  const titleValue = $('title').first().text().trim() || null;
  const title = { present: !!titleValue, length: titleValue?.length ?? 0, value: titleValue };
  if (!title.present) {
    findings.push({ id: 'seo.missing-title', category: 'seo', message: 'Page is missing a <title> tag', severity: 'High' });
  } else if (title.length < 10 || title.length > 60) {
    findings.push({
      id: 'seo.title-length',
      category: 'seo',
      message: `Title tag is ${title.length} characters (recommended 10-60)`,
      severity: 'Medium'
    });
  }

  // --- Meta description ---
  const metaDescValue = $('meta[name="description"]').attr('content')?.trim() || null;
  const metaDescription = {
    present: !!metaDescValue,
    length: metaDescValue?.length ?? 0,
    value: metaDescValue
  };
  if (!metaDescription.present) {
    findings.push({
      id: 'seo.missing-meta-description',
      category: 'seo',
      message: 'Page is missing a meta description',
      severity: 'High'
    });
  } else if (metaDescription.length < 50 || metaDescription.length > 160) {
    findings.push({
      id: 'seo.meta-description-length',
      category: 'seo',
      message: `Meta description is ${metaDescription.length} characters (recommended 50-160)`,
      severity: 'Low'
    });
  }

  // --- Headings ---
  const h1Count = $('h1').length;
  const headingLevels = $('h1, h2, h3, h4, h5, h6')
    .map((_, el) => parseInt(el.tagName.slice(1), 10))
    .get();
  let hasLogicalHierarchy = true;
  for (let i = 1; i < headingLevels.length; i++) {
    if (headingLevels[i] - headingLevels[i - 1] > 1) {
      hasLogicalHierarchy = false;
      break;
    }
  }
  const headings = { h1Count, hasLogicalHierarchy };
  if (h1Count === 0) {
    findings.push({ id: 'seo.no-h1', category: 'seo', message: 'Page has no <h1> heading', severity: 'Medium' });
  } else if (h1Count > 1) {
    findings.push({
      id: 'seo.multiple-h1',
      category: 'seo',
      message: `Page has ${h1Count} <h1> tags; a single H1 is recommended`,
      severity: 'Low'
    });
  }
  if (!hasLogicalHierarchy) {
    findings.push({
      id: 'seo.heading-hierarchy',
      category: 'seo',
      message: 'Heading levels skip a level (e.g. H2 followed directly by H4), breaking logical hierarchy',
      severity: 'Low'
    });
  }

  // --- Canonical ---
  const canonicalValue = $('link[rel="canonical"]').attr('href') || null;
  const canonical = { present: !!canonicalValue, value: canonicalValue };
  if (!canonical.present) {
    findings.push({
      id: 'seo.missing-canonical',
      category: 'seo',
      message: 'Page is missing a canonical link tag',
      severity: 'Low'
    });
  }

  // --- robots.txt / sitemap.xml (real fetches) ---
  const [robotsRes, sitemapRes] = await Promise.all([
    safeFetch(`${origin}/robots.txt`, { method: 'GET', timeoutMs: 8000 }),
    safeFetch(`${origin}/sitemap.xml`, { method: 'GET', timeoutMs: 8000 })
  ]);
  const robotsTxt = { present: !!robotsRes.response && robotsRes.response.status === 200 };
  const sitemapXml = { present: !!sitemapRes.response && sitemapRes.response.status === 200 };
  if (!robotsTxt.present) {
    findings.push({ id: 'seo.missing-robots', category: 'seo', message: 'robots.txt was not found', severity: 'Low' });
  }
  if (!sitemapXml.present) {
    findings.push({ id: 'seo.missing-sitemap', category: 'seo', message: 'sitemap.xml was not found', severity: 'Low' });
  }

  // --- Open Graph / Twitter card ---
  const ogRequired = ['og:title', 'og:description', 'og:image', 'og:url'];
  const ogMissing = ogRequired.filter((tag) => !$(`meta[property="${tag}"]`).attr('content'));
  const openGraph = { present: ogMissing.length < ogRequired.length, missingTags: ogMissing };
  if (ogMissing.length > 0) {
    findings.push({
      id: 'seo.incomplete-og',
      category: 'seo',
      message: `Missing Open Graph tags: ${ogMissing.join(', ')}`,
      severity: 'Low'
    });
  }

  const twitterRequired = ['twitter:card', 'twitter:title', 'twitter:description'];
  const twitterMissing = twitterRequired.filter((tag) => !$(`meta[name="${tag}"]`).attr('content'));
  const twitterCard = { present: twitterMissing.length < twitterRequired.length, missingTags: twitterMissing };
  if (twitterMissing.length === twitterRequired.length) {
    findings.push({
      id: 'seo.missing-twitter-card',
      category: 'seo',
      message: 'No Twitter card tags found',
      severity: 'Low'
    });
  }

  // --- Image alt coverage ---
  const images = $('img');
  const total = images.length;
  let withAlt = 0;
  images.each((_, el) => {
    const alt = $(el).attr('alt');
    if (alt && alt.trim().length > 0) withAlt++;
  });
  const percent = total === 0 ? 100 : Math.round((withAlt / total) * 100);
  const imageAltCoverage = { total, withAlt, percent };
  if (total > 0 && percent < 90) {
    findings.push({
      id: 'seo.image-alt-coverage',
      category: 'seo',
      message: `Only ${percent}% of images (${withAlt}/${total}) have alt text`,
      severity: percent < 50 ? 'High' : 'Medium'
    });
  }

  // --- Structured data (JSON-LD) ---
  const jsonLdScripts = $('script[type="application/ld+json"]');
  const structuredData = { present: jsonLdScripts.length > 0, count: jsonLdScripts.length };
  if (!structuredData.present) {
    findings.push({
      id: 'seo.no-structured-data',
      category: 'seo',
      message: 'No JSON-LD structured data found',
      severity: 'Low'
    });
  }

  return {
    title,
    metaDescription,
    headings,
    canonical,
    robotsTxt,
    sitemapXml,
    openGraph,
    twitterCard,
    imageAltCoverage,
    structuredData,
    findings
  };
}
