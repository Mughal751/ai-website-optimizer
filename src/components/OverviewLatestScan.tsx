'use client';

import Link from 'next/link';
import { useLatestCompleteScan } from '@/lib/useLatestScan';
import { CategoryScoresChart } from './CategoryScoresChart';

export function OverviewLatestScan() {
  const { scan, loading, error } = useLatestCompleteScan();

  if (loading) return <p className="text-caption text-white/40">Loading...</p>;
  if (error) return <p className="text-caption text-danger">{error}</p>;
  if (!scan) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-body text-white/60">No completed scans yet. Run your first scan to see results here.</p>
      </div>
    );
  }

  return (
    <Link href={`/dashboard/${scan._id}`} className="glass-card glass-card-hover block p-6 sm:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <p className="font-medium text-white">{scan.url}</p>
          <p className="text-small text-white/40">Scanned {new Date(scan.createdAt).toLocaleString()}</p>
        </div>
        <div className="text-right">
          <p className="text-h2 font-extrabold text-gradient">{scan.overallScore}</p>
          <p className="text-small text-white/40">Overall score</p>
        </div>
      </div>
      <div className="mt-6">
        <CategoryScoresChart categoryScores={scan.categoryScores} />
      </div>
    </Link>
  );
}
