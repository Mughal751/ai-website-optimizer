'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ScanSearch, ListChecks, Sparkles, Zap } from 'lucide-react';
import clsx from 'clsx';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/scan', label: 'Scan', icon: ScanSearch },
  { href: '/dashboard/recommendations', label: 'Recs', icon: ListChecks },
  { href: '/dashboard/assistant', label: 'Assistant', icon: Sparkles }
];

export function MobileTopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 flex flex-col border-b border-white/[0.08] bg-surface/90 backdrop-blur-lg lg:hidden">
      <div className="flex h-16 items-center gap-2.5 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-button-gradient">
          <Zap className="h-4 w-4 text-white" strokeWidth={2.5} />
        </div>
        <span className="text-body font-bold text-gradient">Optimizer</span>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-2 scrollbar-thin">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-small font-medium transition-all duration-medium',
                active ? 'glass text-white' : 'text-white/60'
              )}
            >
              <Icon className={clsx('h-3.5 w-3.5', active ? 'text-accent-400' : '')} strokeWidth={2} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
