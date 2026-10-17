import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, Radar, BarChart, Bar, CartesianGrid } from 'recharts';
import api, { errMessage } from '../../services/api.js';
import { Card, Skeleton, EmptyState, Badge } from '../../components/common/ui.jsx';

const tooltipStyle = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 };

export default function Progress() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.get('/api/v1/progress/me').then(({ data }) => setStats(data.stats)).catch((err) => setError(errMessage(err)));
  }, []);

  if (error) return <EmptyState icon="⚠️" title="Couldn't load analytics" description={error} />;
  if (!stats) return <div className="mx-auto max-w-5xl"><Skeleton className="h-40" /><Skeleton className="mt-4 h-64" /></div>;

  if (!stats.lessonsTotal) {
    return (
      <EmptyState
        icon="📊"
        title="No data yet"
        description="Finish your first lesson and this page fills with real analytics."
        action={<Link to="/learn" className="btn btn-primary btn-sm">Start learning</Link>}
      />
    );
  }

  const shownTracks = stats.trackStats.filter((t) => filter === 'all' || (filter === 'started' ? t.completed > 0 : true));
  const radar = stats.trackStats
    .filter((t) => t.total)
    .map((t) => ({ track: t.title.replace('CSS ', ''), progress: Math.round((t.completed / t.total) * 100) }));

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-bold tracking-tight">Progress</h1>
      <p className="mt-1 text-sm text-muted">Derived from actual records in your account — no synthetic numbers.</p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card>
          <div className="text-xs text-muted">Overall completion</div>
          <div className="mt-1 text-3xl font-bold text-brand">
            {stats.lessonsTotal ? Math.round((stats.lessonsCompleted / stats.lessonsTotal) * 100) : 0}%
          </div>
          <div className="text-xs text-muted">{stats.lessonsCompleted}/{stats.lessonsTotal} lessons</div>
        </Card>
        <Card>
          <div className="text-xs text-muted">Challenge success rate</div>
          <div className="mt-1 text-3xl font-bold">{stats.challengeAttemptCount ? stats.challengeSuccessRate : '—'}{stats.challengeAttemptCount ? '%' : ''}</div>
          <div className="text-xs text-muted">{stats.challengesPassed} passed · {stats.challengeAttemptCount} attempts</div>
        </Card>
        <Card>
          <div className="text-xs text-muted">Current streak</div>
          <div className="mt-1 text-3xl font-bold">🔥 {stats.streak}<span className="text-sm font-normal text-muted">d</span></div>
          <div className="text-xs text-muted">Days with any activity — visits or submissions</div>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Daily activity (last 7 days)</h2>
          <div className="mt-3 h-56">
            <ResponsiveContainer>
              <AreaChart data={stats.weekly}>
                <defs>
                  <linearGradient id="act" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ff7a45" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#ff7a45" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fill: 'var(--muted)', fontSize: 11 }} stroke="var(--border)" />
                <YAxis allowDecimals={false} tick={{ fill: 'var(--muted)', fontSize: 11 }} width={24} stroke="var(--border)" />
                <Tooltip contentStyle={tooltipStyle} />
                <Area dataKey="visited" stroke="#ff7a45" fill="url(#act)" strokeWidth={2} name="lesson visits" />
                <Area dataKey="attempts" stroke="#c9a24a" fillOpacity={0} strokeWidth={1.5} name="challenge attempts" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Track mastery</h2>
          <div className="mt-3 h-56">
            <ResponsiveContainer>
              <RadarChart data={radar}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="track" tick={{ fill: 'var(--muted)', fontSize: 10 }} />
                <Radar dataKey="progress" stroke="#7fb069" fill="#7fb069" fillOpacity={0.3} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => `${v}%`} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Lessons per track</h2>
          <div className="flex gap-1.5">
            {['all', 'started'].map((f) => (
              <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter(f)}>{f}</button>
            ))}
          </div>
        </div>
        <div className="mt-3 h-64">
          <ResponsiveContainer>
            <BarChart data={shownTracks.map((t) => ({ name: t.title, done: t.completed, remaining: t.total - t.completed }))} layout="vertical">
              <CartesianGrid stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tick={{ fill: 'var(--muted)', fontSize: 11 }} stroke="var(--border)" allowDecimals={false} />
              <YAxis type="category" dataKey="name" width={140} tick={{ fill: 'var(--text)', fontSize: 11 }} stroke="var(--border)" />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="done" stackId="a" fill="#ff7a45" radius={[0, 4, 4, 0]} />
              <Bar dataKey="remaining" stackId="a" fill="var(--elevated)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="mt-6 flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted">Keep going →</span>
        <Link to="/challenges" className="btn btn-secondary btn-sm"><Badge tone="brand">Daily challenge</Badge></Link>
        <span className="text-xs text-muted">streaks reward consistent work, not heroics — 10 minutes counts.</span>
      </Card>
    </div>
  );
}
