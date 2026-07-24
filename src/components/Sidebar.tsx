'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { LayoutDashboard, ScanSearch, ListChecks, Sparkles, LogOut, Zap } from 'lucide-react';
import clsx from 'clsx';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/scan', label: 'Scan', icon: ScanSearch },
  { href: '/dashboard/recommendations', label: 'Recommendations', icon: ListChecks },
  { href: '/dashboard/assistant', label: 'Virtual Assistant', icon: Sparkles }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-white/[0.08] bg-surface/80 backdrop-blur-lg lg:flex">
      <div className="flex h-20 items-center gap-2.5 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-button-gradient shadow-glow-primary">
          <Zap className="h-5 w-5 text-white" strokeWidth={2.5} />
        </div>
        <span className="text-body-lg font-bold text-gradient">Optimizer</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1.5 px-4 py-4">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'group flex items-center gap-3 rounded-md px-4 py-3 text-caption font-medium transition-all duration-medium',
                active ? 'glass text-white shadow-glow-primary/50' : 'text-white/60 hover:bg-white/[0.04] hover:text-white'
              )}
            >
              <Icon
                className={clsx('h-[18px] w-[18px] transition-colors', active ? 'text-accent-400' : 'text-white/50 group-hover:text-accent-400')}
                strokeWidth={2}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/[0.08] p-4">
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="btn-ghost w-full justify-start px-4"
        >
          <LogOut className="h-[18px] w-[18px]" strokeWidth={2} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
