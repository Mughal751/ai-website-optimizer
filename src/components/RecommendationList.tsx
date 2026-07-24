'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { ChevronDown, CheckCircle2 } from 'lucide-react';

interface Recommendation {
  category: string;
  issue: string;
  impact: 'High' | 'Medium' | 'Low';
  effort: 'Quick win' | 'Larger fix';
  explanation: string;
  fixSteps: string[];
}

export function RecommendationList({ recommendations }: { recommendations: Recommendation[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  if (recommendations.length === 0) {
    return (
      <div className="glass-card flex items-center gap-3 border-success/30 p-6">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
        <p className="text-body text-white/70">
          No issues were detected across any category. Nothing to recommend here.
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {recommendations.map((rec, idx) => {
        const isOpen = openIdx === idx;
        return (
          <li key={idx} className="glass-card overflow-hidden">
            <button
              onClick={() => setOpenIdx(isOpen ? null : idx)}
              className="flex w-full items-center justify-between gap-4 p-5 text-left"
            >
              <div className="flex min-w-0 items-center gap-3">
                <ImpactBadge impact={rec.impact} />
                <span className="hidden shrink-0 text-small font-semibold uppercase tracking-wide text-white/30 sm:inline">
                  {rec.category}
                </span>
                <span className="truncate font-medium text-white">{rec.issue}</span>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="hidden text-small text-white/40 sm:inline">{rec.effort}</span>
                <ChevronDown className={clsx('h-4 w-4 text-white/40 transition-transform duration-medium', isOpen && 'rotate-180')} />
              </div>
            </button>
            {isOpen && (
              <div className="border-t border-white/[0.08] px-5 py-5 text-body text-white/70">
                <p className="mb-4">{rec.explanation}</p>
                <p className="mb-2 font-semibold text-white">How to fix it</p>
                <ul className="flex flex-col gap-2">
                  {rec.fixSteps.map((step, i) => (
                    <li key={i} className="flex gap-2.5">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-400" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function ImpactBadge({ impact }: { impact: Recommendation['impact'] }) {
  return (
    <span
      className={clsx('badge shrink-0', {
        'bg-danger/15 text-danger': impact === 'High',
        'bg-warning/15 text-warning': impact === 'Medium',
        'bg-white/10 text-white/50': impact === 'Low'
      })}
    >
      {impact}
    </span>
  );
}
