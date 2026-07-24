'use client';

import Link from 'next/link';
import { useLatestCompleteScan } from '@/lib/useLatestScan';
import { RecommendationList } from '@/components/RecommendationList';

export default function RecommendationsPage() {
  const { scan, loading, error } = useLatestCompleteScan();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-h2 font-extrabold text-gradient">Recommendations</h1>
        <p className="mt-2 text-body text-white/60">
          Prioritized, actionable fixes generated from your latest completed scan.
        </p>
      </div>

      {loading && <p className="text-caption text-white/40">Loading...</p>}
      {error && <p className="text-caption text-danger">{error}</p>}

      {!loading && !error && !scan && (
        <div className="glass-card p-8 text-center">
          <p className="text-body text-white/60">
            No completed scans yet.{' '}
            <Link href="/dashboard/scan" className="text-accent-400 underline">
              Run a scan
            </Link>{' '}
            to see recommendations here.
          </p>
        </div>
      )}

      {scan && (
        <>
          <div className="glass-card flex flex-wrap items-center justify-between gap-3 p-5">
            <div>
              <p className="text-caption text-white/40">Showing recommendations for</p>
              <p className="font-medium text-white">{scan.url}</p>
            </div>
            <Link href={`/dashboard/${scan._id}`} className="btn-ghost">
              View full scan
            </Link>
          </div>
          <RecommendationList recommendations={scan.recommendations} />
        </>
      )}
    </div>
  );
}
