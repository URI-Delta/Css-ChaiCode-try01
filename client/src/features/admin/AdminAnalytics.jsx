import { useEffect, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import api, { errMessage } from '../../services/api.js';
import { Card, Skeleton, EmptyState } from '../../components/common/ui.jsx';
import { AdminError } from './shared.jsx';

const tooltipStyle = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 };

export default function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/api/v1/admin/analytics').then(({ data }) => setData(data.analytics)).catch((err) => setError(errMessage(err)));
  }, []);

  if (error) return <AdminError message={error} />;
  if (!data) return <Skeleton className="h-96" />;

  const hasAny = (data.byTrack?.length || data.aiUsage?.length || data.learningActivity?.length);

  if (!hasAny) {
    return <EmptyState icon="📈" title="No analytics yet" description="Charts appear as users visit lessons, submit challenges and use the tutor." />;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Lesson completions by track</h2>
        <div className="mt-3 h-64">
          <ResponsiveContainer>
            <BarChart data={data.byTrack.map((t) => ({ name: t.title?.[0]?.title || 'track', completed: t.completed, visits: t.visits }))}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: 'var(--muted)', fontSize: 10 }} stroke="var(--border)" />
              <YAxis tick={{ fill: 'var(--muted)', fontSize: 11 }} stroke="var(--border)" allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="completed" fill="#ff7a45" radius={[4, 4, 0, 0]} />
              <Bar dataKey="visits" fill="#c9a24a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Challenge attempts (top 15)</h2>
        <div className="mt-3 h-64 overflow-auto">
          {data.challengeAttempts?.length ? (
            <ul className="grid gap-1.5 text-sm">
              {data.challengeAttempts.map((c, i) => (
                <li key={i} className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2">
                  <span className="truncate">{c.title?.[0]?.title || 'challenge'}</span>
                  <span className="ml-auto font-mono text-xs text-muted">{c.passed}/{c.attempts} passed</span>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted">No attempts yet.</p>}
        </div>
      </Card>

      <Card className="lg:col-span-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">AI usage by day</h2>
        <div className="mt-3 h-64">
          <ResponsiveContainer>
            <BarChart data={(data.aiUsage || []).map((d) => ({ day: d.day || d._id, requests: d.requests }))}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: 'var(--muted)', fontSize: 10 }} stroke="var(--border)" />
              <YAxis tick={{ fill: 'var(--muted)', fontSize: 11 }} stroke="var(--border)" allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="requests" fill="#c9a24a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="lg:col-span-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Learning activity by day</h2>
        <div className="mt-3 h-64">
          <ResponsiveContainer>
            <BarChart data={(data.learningActivity || []).map((d) => ({ day: d.day, visits: d.visits }))}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: 'var(--muted)', fontSize: 10 }} stroke="var(--border)" />
              <YAxis tick={{ fill: 'var(--muted)', fontSize: 11 }} stroke="var(--border)" allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="visits" fill="#7fb069" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
