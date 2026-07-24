import { describe, it, expect } from 'vitest';
import { buildRecommendations } from '@/worker/recommendations';
import type { Finding } from '@/types/scan';

describe('buildRecommendations', () => {
  it('returns an empty list when there are no findings', () => {
    expect(buildRecommendations([])).toEqual([]);
  });

  it('produces exactly one recommendation per finding - no padding', () => {
    const findings: Finding[] = [
      { id: 'seo.missing-title', category: 'seo', message: 'Missing title', severity: 'High' },
      { id: 'security.no-https', category: 'security', message: 'No HTTPS', severity: 'High' }
    ];
    const recs = buildRecommendations(findings);
    expect(recs).toHaveLength(2);
  });

  it('sorts recommendations by impact, High first', () => {
    const findings: Finding[] = [
      { id: 'seo.missing-canonical', category: 'seo', message: 'low sev', severity: 'Low' },
      { id: 'seo.missing-title', category: 'seo', message: 'high sev', severity: 'High' },
      { id: 'seo.no-h1', category: 'seo', message: 'medium sev', severity: 'Medium' }
    ];
    const recs = buildRecommendations(findings);
    expect(recs.map((r) => r.impact)).toEqual(['High', 'Medium', 'Low']);
  });

  it('carries through the real detected issue text, not generic filler', () => {
    const findings: Finding[] = [
      { id: 'links.broken-found', category: 'links', message: '7 of 40 checked links appear broken', severity: 'Medium' }
    ];
    const recs = buildRecommendations(findings);
    expect(recs[0].issue).toBe('7 of 40 checked links appear broken');
    expect(recs[0].fixSteps.length).toBeGreaterThan(0);
  });

  it('falls back gracefully for an unknown accessibility finding id', () => {
    const findings: Finding[] = [
      { id: 'accessibility.color-contrast', category: 'accessibility', message: 'Contrast issue', severity: 'High' }
    ];
    const recs = buildRecommendations(findings);
    expect(recs[0].explanation).toContain('WCAG');
  });
});
