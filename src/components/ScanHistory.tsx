'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { ChevronRight, Clock, Loader2, CheckCircle2, XCircle } from 'lucide-react';

interface HistoryItem {
  _id: string;
  url: string;
  status: 'queued' | 'running' | 'complete' | 'failed';
  overallScore: number | null;
  createdAt: string;
}

export function ScanHistory() {
  const [scans, setScans] = useState<HistoryItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/scan')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setScans(data.scans ?? []);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load scan history');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <p className="text-caption text-danger">{error}</p>;
  if (!scans) return <p className="text-caption text-white/40">Loading...</p>;
  if (scans.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-body text-white/60">No scans yet — analyze a site above to get started.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {scans.map((scan) => (
        <Link
          key={scan._id}
          href={`/dashboard/${scan._id}`}
          className="glass-card glass-card-hover flex items-center justify-between gap-4 p-5"
        >
          <div className="min-w-0">
            <p className="truncate font-medium text-white">{scan.url}</p>
            <p className="text-small text-white/40">{new Date(scan.createdAt).toLocaleString()}</p>
          </div>
          <div className="flex shrink-0 items-center gap-4">
            <StatusBadge status={scan.status} />
            {scan.overallScore !== null && (
              <span className="text-h4 font-bold text-gradient">{scan.overallScore}</span>
            )}
            <ChevronRight className="h-4 w-4 text-white/30" />
          </div>
        </Link>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: HistoryItem['status'] }) {
  const config = {
    queued: { icon: Clock, className: 'bg-white/10 text-white/60' },
    running: { icon: Loader2, className: 'bg-primary-500/20 text-primary-300', spin: true },
    complete: { icon: CheckCircle2, className: 'bg-success/15 text-success' },
    failed: { icon: XCircle, className: 'bg-danger/15 text-danger' }
  }[status];
  const Icon = config.icon;

  return (
    <span className={clsx('badge gap-1', config.className)}>
      <Icon className={clsx('h-3 w-3', 'spin' in config && config.spin && 'animate-spin')} />
      {status}
    </span>
  );
}
