import type { CategoryKey, CategoryScores, Finding, Impact, PerformanceResult } from '@/types/scan';

const SEVERITY_PENALTY: Record<Impact, number> = {
  High: 15,
  Medium: 7,
  Low: 2
};

/**
 * Scores a single category 0-100 by starting at 100 and subtracting a
 * penalty per finding based on severity, floored at 0. Deterministic and
 * derived only from real findings — no random or hardcoded values.
 */
export function scoreCategory(findings: Finding[]): number {
  const score = findings.reduce((acc, f) => acc - SEVERITY_PENALTY[f.severity], 100);
  return Math.max(0, Math.min(100, Math.round(score)));
}

export interface AllFindings {
  seo: Finding[];
  performance: Finding[];
  accessibility: Finding[];
  mobile: Finding[];
  security: Finding[];
  links: Finding[];
}

export function computeCategoryScores(
  findings: AllFindings,
  performance?: PerformanceResult
): CategoryScores {
  return {
    seo: scoreCategory(findings.seo),
    // Performance has a real Lighthouse score already on a 0-100 scale —
    // prefer it directly over the generic penalty model when available,
    // since it's a calibrated real measurement rather than a heuristic.
    performance: performance?.lighthouseScore ?? scoreCategory(findings.performance),
    accessibility: scoreCategory(findings.accessibility),
    mobile: scoreCategory(findings.mobile),
    security: scoreCategory(findings.security),
    links: scoreCategory(findings.links)
  };
}

const CATEGORY_WEIGHTS: Record<CategoryKey, number> = {
  seo: 0.2,
  performance: 0.25,
  accessibility: 0.2,
  mobile: 0.15,
  security: 0.15,
  links: 0.05
};

export function computeOverallScore(categoryScores: CategoryScores): number {
  const weightedSum = (Object.keys(categoryScores) as CategoryKey[]).reduce(
    (sum, key) => sum + categoryScores[key] * CATEGORY_WEIGHTS[key],
    0
  );
  return Math.round(weightedSum);
}
