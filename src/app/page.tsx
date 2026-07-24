import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { ArrowRight, Search, ShieldCheck, Gauge, Smartphone, Link2, Sparkles } from 'lucide-react';

const FEATURES = [
  { icon: Search, label: 'SEO', desc: 'Titles, meta tags, structured data, sitemaps.' },
  { icon: Gauge, label: 'Performance', desc: 'Real Lighthouse Core Web Vitals.' },
  { icon: ShieldCheck, label: 'Security', desc: 'Headers, HTTPS, mixed content.' },
  { icon: Smartphone, label: 'Mobile', desc: 'Real screenshots, tap-target sizing.' },
  { icon: Link2, label: 'Links', desc: 'Real crawl for broken links.' },
  { icon: Sparkles, label: 'AI Assistant', desc: 'Ask questions about your results.' }
];

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (session) redirect('/dashboard');

  return (
    <main className="relative overflow-hidden">
      <div className="mx-auto flex min-h-screen max-w-content flex-col items-center justify-center px-6 py-20 text-center">
        <span className="badge glass mb-6 gap-1.5 text-white/70">
          <Sparkles className="h-3 w-3 text-accent-400" />
          Real audits. Real recommendations.
        </span>

        <h1 className="max-w-3xl text-h1 font-extrabold leading-tight text-white sm:text-display">
          Know exactly what&rsquo;s <span className="text-gradient">holding your site back</span>
        </h1>

        <p className="mt-6 max-w-xl text-body-lg text-white/60">
          Paste a URL and get a real SEO, performance, accessibility, mobile, security, and
          broken-link audit — with prioritized fixes ranked by impact and effort.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Link href="/signup" className="btn-primary">
            Get started free
            <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
          </Link>
          <Link href="/signin" className="btn-secondary">
            Sign in
          </Link>
        </div>

        <div className="mt-24 grid w-full grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.label} className="glass-card glass-card-hover flex flex-col items-center gap-2 p-5 text-center">
                <Icon className="h-5 w-5 text-accent-400" strokeWidth={2} />
                <p className="text-caption font-semibold text-white">{f.label}</p>
                <p className="text-small text-white/40">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
