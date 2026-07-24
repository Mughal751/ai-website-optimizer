'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import clsx from 'clsx';
import { CategoryScoresChart } from '@/components/CategoryScoresChart';
import { RecommendationList } from '@/components/RecommendationList';
import { AssistantChat } from '@/components/AssistantChat';

const POLL_INTERVAL_MS = 3000;

export default function ScanDetailPage() {
  const { scanId } = useParams<{ scanId: string }>();
  const [scan, setScan] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      try {
        const res = await fetch(`/api/scan/${scanId}`);
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error ?? 'Could not load scan');
          return;
        }
        setScan(data.scan);
        if (data.scan.status === 'queued' || data.scan.status === 'running') {
          timer = setTimeout(poll, POLL_INTERVAL_MS);
        }
      } catch {
        if (!cancelled) setError('Network error loading scan');
      }
    }
    poll();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [scanId]);

  if (error) return <p className="text-body text-danger">{error}</p>;
  if (!scan) return <p className="text-body text-white/40">Loading...</p>;

  if (scan.status === 'queued' || scan.status === 'running') {
    return (
      <div className="glass-card p-8 sm:p-10">
        <h1 className="mb-2 text-h3 font-bold text-white">{scan.url}</h1>
        <p className="text-body text-white/60">
          Scan is {scan.status}... full scans can take 15-60+ seconds. This page updates automatically.
        </p>
        <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
          <div className="h-full w-1/3 animate-pulse rounded-full bg-button-gradient" />
        </div>
      </div>
    );
  }

  if (scan.status === 'failed') {
    return (
      <div className="glass-card p-8 sm:p-10">
        <h1 className="mb-2 text-h3 font-bold text-white">{scan.url}</h1>
        <p className="rounded-md border border-danger/30 bg-danger/10 p-4 text-body text-danger">
          Scan failed: {scan.error ?? 'Unknown error'}
        </p>
      </div>
    );
  }

  const categories = Object.keys(scan.rawResults ?? {});

  return (
    <div className="flex flex-col gap-10">
      <div className="glass-card flex flex-wrap items-baseline justify-between gap-4 p-6 sm:p-8">
        <div>
          <h1 className="text-h3 font-bold text-white">{scan.url}</h1>
          <p className="mt-1 text-caption text-white/40">
            Scanned {new Date(scan.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="text-right">
          <p className="text-display font-extrabold text-gradient">{scan.overallScore}</p>
          <p className="text-caption text-white/40">Overall score</p>
        </div>
      </div>

      <section className="glass-card p-6 sm:p-8">
        <h2 className="mb-5 text-h4 font-semibold text-white">Category scores</h2>
        <CategoryScoresChart categoryScores={scan.categoryScores} />
      </section>

      <section>
        <h2 className="mb-4 text-h4 font-semibold text-white">Recommendations</h2>
        <RecommendationList recommendations={scan.recommendations} />
      </section>

      <section>
        <h2 className="mb-4 text-h4 font-semibold text-white">Raw data</h2>
        <div className="flex flex-col gap-3">
          {categories.map((cat) => {
            const isOpen = openCategory === cat;
            return (
              <div key={cat} className="glass-card overflow-hidden">
                <button
                  onClick={() => setOpenCategory(isOpen ? null : cat)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left"
                >
                  <span className="font-medium capitalize text-white">{cat}</span>
                  <ChevronDown className={clsx('h-4 w-4 text-white/40 transition-transform duration-medium', isOpen && 'rotate-180')} />
                </button>
                {isOpen && (
                  <pre className="scrollbar-thin max-h-96 overflow-auto border-t border-white/[0.08] bg-black/20 p-5 text-small text-white/70">
                    {JSON.stringify(scan.rawResults[cat], null, 2)}
                  </pre>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-h4 font-semibold text-white">Virtual Assistant</h2>
        <AssistantChat scanId={scanId} />
      </section>
    </div>
  );
}
