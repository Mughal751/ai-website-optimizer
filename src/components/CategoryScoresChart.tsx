'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts';

interface Props {
  categoryScores: Record<string, number>;
}

const LABELS: Record<string, string> = {
  seo: 'SEO',
  performance: 'Performance',
  accessibility: 'Accessibility',
  mobile: 'Mobile',
  security: 'Security',
  links: 'Links'
};

function scoreColor(score: number): string {
  if (score >= 80) return '#22C55E';
  if (score >= 50) return '#FBBF24';
  return '#EF4444';
}

export function CategoryScoresChart({ categoryScores }: Props) {
  const data = Object.entries(categoryScores).map(([key, value]) => ({
    name: LABELS[key] ?? key,
    score: value
  }));

  return (
    <div style={{ width: '100%', height: 260 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.08)" />
          <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.5)' }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={false} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.5)' }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: '#101827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, color: '#fff' }}
            cursor={{ fill: 'rgba(255,255,255,0.04)' }}
          />
          <Bar dataKey="score" radius={[8, 8, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={scoreColor(entry.score)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
