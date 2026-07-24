'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { Zap, Mail, Lock, ArrowRight } from 'lucide-react';

export default function SigninPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await signIn('credentials', { email, password, redirect: false });
      if (res?.error) {
        setError('Invalid email or password');
        return;
      }
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="glass-card w-full max-w-sm p-8 shadow-lg">
        <div className="mb-8 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-button-gradient shadow-glow-primary">
            <Zap className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-body-lg font-bold text-gradient">Optimizer</span>
        </div>

        <h1 className="mb-1 text-h4 font-bold text-white">Welcome back</h1>
        <p className="mb-6 text-caption text-white/50">Sign in to view your scans.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-white/40" strokeWidth={2} />
            <input
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-glass pl-11"
            />
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-white/40" strokeWidth={2} />
            <input
              type="password"
              required
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-glass pl-11"
            />
          </div>
          {error && <p className="text-caption text-danger">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary mt-2 justify-center">
            {loading ? 'Signing in...' : 'Sign in'}
            {!loading && <ArrowRight className="h-4 w-4" strokeWidth={2.5} />}
          </button>
        </form>

        <p className="mt-6 text-center text-caption text-white/50">
          No account?{' '}
          <Link href="/signup" className="font-medium text-accent-400 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
