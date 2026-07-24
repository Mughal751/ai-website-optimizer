'use client';

import Link from 'next/link';
import { useLatestCompleteScan } from '@/lib/useLatestScan';
import { AssistantChat } from '@/components/AssistantChat';

export default function AssistantPage() {
  const { scan, loading, error } = useLatestCompleteScan();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-h2 font-extrabold text-gradient">Virtual Assistant</h1>
        <p className="mt-2 text-body text-white/60">
          Ask questions about your latest completed scan — the assistant answers using your
          real scan data.
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
            to start asking questions.
          </p>
        </div>
      )}

      {scan && (
        <>
          <div className="glass-card flex flex-wrap items-center justify-between gap-3 p-5">
            <div>
              <p className="text-caption text-white/40">Asking about</p>
              <p className="font-medium text-white">{scan.url}</p>
            </div>
            <Link href={`/dashboard/${scan._id}`} className="btn-ghost">
              View full scan
            </Link>
          </div>
          <AssistantChat scanId={scan._id} />
        </>
      )}
    </div>
  );
}
