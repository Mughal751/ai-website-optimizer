import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { OverviewLatestScan } from '@/components/OverviewLatestScan';
import { SetNamePrompt } from '@/components/SetNamePrompt';
import { ScanSearch, ListChecks, Sparkles } from 'lucide-react';
import Link from 'next/link';

const SHORTCUTS = [
  {
    href: '/dashboard/scan',
    icon: ScanSearch,
    title: 'Run a scan',
    description: 'Analyze a new URL or revisit your scan history.'
  },
  {
    href: '/dashboard/recommendations',
    icon: ListChecks,
    title: 'Recommendations',
    description: 'See prioritized fixes from your latest completed scan.'
  },
  {
    href: '/dashboard/assistant',
    icon: Sparkles,
    title: 'Virtual Assistant',
    description: 'Ask questions about your latest scan results.'
  }
];

export default async function OverviewPage() {
  const session = await getServerSession(authOptions);
  const name = session?.user?.name;

  return (
    <div className="flex flex-col gap-10">
      <div>
        <p className="text-caption font-semibold uppercase tracking-wide text-accent-400">Welcome back</p>
        <h1 className="mt-1 text-h2 font-extrabold text-gradient">{name || 'there'}</h1>
      </div>

      {!name && <SetNamePrompt />}

      <div className="grid gap-4 sm:grid-cols-3">
        {SHORTCUTS.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.href} href={s.href} className="glass-card glass-card-hover flex flex-col gap-3 p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-button-gradient shadow-glow-primary/60">
                <Icon className="h-5 w-5 text-white" strokeWidth={2} />
              </div>
              <div>
                <p className="font-semibold text-white">{s.title}</p>
                <p className="mt-1 text-caption text-white/50">{s.description}</p>
              </div>
            </Link>
          );
        })}
      </div>

      <div>
        <h2 className="mb-4 text-h4 font-semibold text-white">Latest scan</h2>
        <OverviewLatestScan />
      </div>
    </div>
  );
}