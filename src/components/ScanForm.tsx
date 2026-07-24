'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Globe } from 'lucide-react';

export function ScanForm() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Could not start scan');
        return;
      }
      router.push(`/dashboard/${data.scanId}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
      <div className="relative flex-1">
        <Globe className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-white/40" strokeWidth={2} />
        <input
          type="text"
          required
          placeholder="example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="input-glass pl-11"
        />
      </div>
      <button type="submit" disabled={loading} className="btn-primary shrink-0">
        {loading ? 'Starting...' : 'Analyze'}
        {!loading && <ArrowRight className="h-4 w-4" strokeWidth={2.5} />}
      </button>
      {error && <p className="self-center text-caption text-danger">{error}</p>}
    </form>
  );
}
