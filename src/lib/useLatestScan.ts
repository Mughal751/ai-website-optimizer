'use client';

import { useEffect, useState } from 'react';

export function useLatestCompleteScan() {
  const [scan, setScan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const historyRes = await fetch('/api/scan');
        const historyData = await historyRes.json();
        if (!historyRes.ok) throw new Error(historyData.error ?? 'Could not load scan history');

        const latestComplete = (historyData.scans ?? []).find((s: any) => s.status === 'complete');
        if (!latestComplete) {
          if (!cancelled) {
            setScan(null);
            setLoading(false);
          }
          return;
        }

        const detailRes = await fetch(`/api/scan/${latestComplete._id}`);
        const detailData = await detailRes.json();
        if (!detailRes.ok) throw new Error(detailData.error ?? 'Could not load scan');

        if (!cancelled) {
          setScan(detailData.scan);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError((err as Error).message);
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { scan, loading, error };
}
