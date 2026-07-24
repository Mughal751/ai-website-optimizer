'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { ArrowRight } from 'lucide-react';

export function SetNamePrompt() {
  const { update } = useSession();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Could not save name');
        return;
      }
      // Refreshes the JWT/session client-side so the new name shows
      // immediately, without needing to sign out and back in.
      await update({ name: data.name });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
      <p className="text-caption text-white/60 sm:flex-1">
        What should we call you? This replaces your email on the dashboard.
      </p>
      <div className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          maxLength={60}
          className="input-glass flex-1 sm:w-48"
          style={{ height: 44 }}
        />
        <button type="submit" disabled={loading} className="btn-primary shrink-0 px-4" style={{ height: 44 }}>
          {loading ? '...' : <ArrowRight className="h-4 w-4" strokeWidth={2.5} />}
        </button>
      </div>
      {error && <p className="text-small text-danger">{error}</p>}
    </form>
  );
}