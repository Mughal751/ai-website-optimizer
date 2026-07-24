export type ScanStatus = 'queued' | 'running' | 'complete' | 'failed';
export type Impact = 'High' | 'Medium' | 'Low';
export type Effort = 'Quick win' | 'Larger fix';
export type CategoryKey =
  | 'seo'
  | 'performance'
  | 'accessibility'
  | 'mobile'
  | 'security'
  | 'links';

/** A single detected problem, before it's turned into a recommendation. */
export interface Finding {
  id: string; // stable id, e.g. "seo.missing-meta-description"
  category: CategoryKey;
  message: string; // human-readable description of what was found
  severity: Impact;
  detail?: Record<string, unknown>; // raw supporting data (e.g. the offending URL)
}

export interface Recommendation {
  category: CategoryKey;
  issue: string;
  impact: Impact;
  effort: Effort;
  explanation: string;
  fixSteps: string[];
}

export interface CategoryScores {
  seo: number;
  performance: number;
  accessibility: number;
  mobile: number;
  security: number;
  links: number;
}

export interface SeoResult {
  title: { present: boolean; length: number; value: string | null };
  metaDescription: { present: boolean; length: number; value: string | null };
  headings: { h1Count: number; hasLogicalHierarchy: boolean };
  canonical: { present: boolean; value: string | null };
  robotsTxt: { present: boolean };
  sitemapXml: { present: boolean };
  openGraph: { present: boolean; missingTags: string[] };
  twitterCard: { present: boolean; missingTags: string[] };
  imageAltCoverage: { total: number; withAlt: number; percent: number };
  structuredData: { present: boolean; count: number };
  findings: Finding[];
}

export interface SecurityResult {
  https: boolean;
  headers: Record<string, string | null>;
  missingHeaders: string[];
  mixedContent: boolean;
  findings: Finding[];
}

export interface LinkCheckResult {
  url: string;
  status: number | null;
  ok: boolean;
  error?: string;
}

export interface LinksResult {
  totalFound: number;
  totalChecked: number;
  broken: LinkCheckResult[];
  findings: Finding[];
}

export interface PerformanceResult {
  lighthouseScore: number | null;
  lcpMs: number | null;
  clsScore: number | null;
  inpMs: number | null;
  findings: Finding[];
}

export interface AccessibilityResult {
  violations: Array<{
    id: string;
    impact: string | null;
    description: string;
    nodes: number;
  }>;
  findings: Finding[];
}

export interface MobileResult {
  viewportMetaPresent: boolean;
  desktopScreenshot: string | null; // base64
  mobileScreenshot: string | null; // base64
  tapTargetIssues: number;
  findings: Finding[];
}

export interface RawResults {
  seo: SeoResult;
  security: SecurityResult;
  links: LinksResult;
  performance: PerformanceResult;
  accessibility: AccessibilityResult;
  mobile: MobileResult;
}
