import { describe, it, expect } from 'vitest';
import { scoreCategory, computeCategoryScores, computeOverallScore } from '@/worker/scoring';
import type { Finding, PerformanceResult } from '@/types/scan';

function finding(severity: Finding['severity']): Finding {
  return { id: 'test.id', category: 'seo', message: 'test', severity };
}

describe('scoreCategory', () => {
  it('returns 100 for no findings', () => {
    expect(scoreCategory([])).toBe(100);
  });

  it('subtracts penalties by severity', () => {
    const score = scoreCategory([finding('High'), finding('Medium'), finding('Low')]);
    // 100 - 15 - 7 - 2 = 76
    expect(score).toBe(76);
  });

  it('never goes below 0', () => {
    const many = Array.from({ length: 20 }, () => finding('High'));
    expect(scoreCategory(many)).toBe(0);
  });

  it('never exceeds 100', () => {
    expect(scoreCategory([])).toBeLessThanOrEqual(100);
  });
});

describe('computeCategoryScores', () => {
  it('prefers the real Lighthouse score for performance when available', () => {
    const perf: PerformanceResult = {
      lighthouseScore: 42,
      lcpMs: 3000,
      clsScore: 0.05,
      inpMs: 100,
      findings: [finding('High')]
    };
    const scores = computeCategoryScores(
      { seo: [], performance: perf.findings, accessibility: [], mobile: [], security: [], links: [] },
      perf
    );
    expect(scores.performance).toBe(42);
  });

  it('falls back to the heuristic score when no Lighthouse score is present', () => {
    const scores = computeCategoryScores({
      seo: [],
      performance: [finding('High')],
      accessibility: [],
      mobile: [],
      security: [],
      links: []
    });
    expect(scores.performance).toBe(85); // 100 - 15
  });
});

describe('computeOverallScore', () => {
  it('computes a weighted average across categories', () => {
    const overall = computeOverallScore({
      seo: 100,
      performance: 100,
      accessibility: 100,
      mobile: 100,
      security: 100,
      links: 100
    });
    expect(overall).toBe(100);
  });

  it('weights performance and accessibility more than links', () => {
    const allZeroExceptLinks = computeOverallScore({
      seo: 0,
      performance: 0,
      accessibility: 0,
      mobile: 0,
      security: 0,
      links: 100
    });
    // links weight is 0.05, so max contribution is 5
    expect(allZeroExceptLinks).toBe(5);
  });
});
