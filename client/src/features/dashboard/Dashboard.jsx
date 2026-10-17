import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Trophy, FolderKanban, Flame, Sparkles, Activity, PlayCircle } from 'lucide-react';
import api, { errMessage } from '../../services/api.js';
import { useAuthStore } from '../../store/authStore.js';
import { Card, Skeleton, Badge } from '../../components/common/ui.jsx';
import Button from '../../components/common/Button.jsx';

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/api/v1/progress/me')
      .then(({ data }) => setStats(data.stats))
      .catch((err) => setError(errMessage(err)));
  }, []);

  if (error) {
    return <Card className="border-error/40 text-sm text-error">Failed to load your progress — {error}</Card>;
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-sm text-muted">Your learning at a glance — everything here comes from your real activity.</p>
        </div>
        <Link to="/learn" className="btn btn-primary ml-auto">
          <PlayCircle size={16} /> Continue learning
        </Link>
      </div>

      {/* stat tiles */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon={BookOpen} label="Lessons completed" value={stats ? `${stats.lessonsCompleted}/${stats.lessonsTotal}` : null} to="/learn" />
        <StatTile icon={Trophy} label="Challenges passed" value={stats ? stats.challengesPassed : null} to="/challenges" />
        <StatTile icon={FolderKanban} label="Projects" value={stats ? stats.projectsCount : null} to="/projects" />
        <StatTile icon={Flame} label="Current streak" value={stats ? `${stats.streak}d` : null} to="/progress" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {/* track progress */}
        <Card className="lg:col-span-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Track-by-track progress</h2>
          <div className="mt-4 grid gap-3">
            {stats ? (
              stats.trackStats.map((t) => (
                <div key={t.trackId}>
                  <div className="flex items-center justify-between text-sm">
                    <Link to={`/learn/${t.slug}`} className="flex items-center gap-2 hover:text-brand">
                      <span aria-hidden>{t.emoji}</span> {t.title}
                    </Link>
                    <span className="font-mono text-xs text-muted">{t.completed}/{t.total}</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-elevated">
                    <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${t.total ? (t.completed / t.total) * 100 : 0}%` }} />
                  </div>
                </div>
              ))
            ) : (
              Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-6" />)
            )}
          </div>
        </Card>

        {/* right column */}
        <div className="grid content-start gap-4">
          <Card>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">This week</h2>
            <div className="mt-3 flex h-24 items-end gap-1.5">
              {stats ? stats.weekly.map((d, i) => {
                const max = Math.max(1, ...stats.weekly.map((w) => w.visited + w.attempts));
                return (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1" title={`${d.visited} visits · ${d.attempts} attempts`}>
                    <div className="w-full rounded-t bg-brand/80" style={{ height: `${((d.visited + d.attempts) / max) * 70 + 4}px` }} />
                    <span className="text-[10px] text-muted">{d.day}</span>
                  </div>
                );
              }) : <Skeleton className="h-20 w-full" />}
            </div>
          </Card>
          <Card>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Subscription</h2>
            <div className="mt-2 flex items-center gap-2">
              <Badge tone={user?.plan === 'pro' ? 'pro' : 'default'}>{user?.plan}</Badge>
              {user?.plan === 'free' && <Link to="/pricing" className="text-xs text-pro hover:underline">Upgrade →</Link>}
              {user?.plan === 'pro' && <Link to="/billing" className="text-xs text-muted hover:text-text">Manage →</Link>}
            </div>
            <h2 className="mt-4 text-sm font-semibold uppercase tracking-wider text-muted">AI tutor today</h2>
            <AiUsageMini />
          </Card>
        </div>
      </div>

      {/* continue learning */}
      <Card className="mt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Recent activity</h2>
        {stats?.recent?.length ? (
          <ul className="mt-3 grid gap-2">
            {stats.recent.map((r) => (
              <li key={r.lessonId} className="flex items-center gap-3 rounded-lg border border-line bg-surface p-3 text-sm">
                <Activity size={15} className="text-muted" aria-hidden />
                <Link to={`/lesson/${r.slug}`} className="font-medium hover:text-brand">{r.title}</Link>
                <span className="text-xs text-muted">{r.trackTitle}</span>
                {r.completed ? <Badge tone="success" className="ml-auto">done</Badge> : <Badge className="ml-auto">in progress</Badge>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted">
            No activity yet — <Link to="/learn" className="text-brand hover:underline">start your first lesson</Link>. It takes about 12 minutes.
          </p>
        )}
      </Card>
    </div>
  );
}

function StatTile({ icon: Icon, label, value, to }) {
  const body = (
    <Card className="flex items-center gap-4 transition-colors hover:border-brand/50">
      <span className="grid h-10 w-10 place-items-center rounded-lg bg-elevated text-brand">
        <Icon size={19} aria-hidden />
      </span>
      <div>
        <div className="text-2xl font-bold">{value ?? <Skeleton className="h-7 w-16" />}</div>
        <div className="text-xs text-muted">{label}</div>
      </div>
    </Card>
  );
  return to ? <Link to={to}>{body}</Link> : body;
}

function AiUsageMini() {
  const [usage, setUsage] = useState(null);
  useEffect(() => {
    api.get('/api/v1/ai/usage').then(({ data }) => setUsage(data)).catch(() => setUsage({ used: 0, quota: 0, configured: false }));
  }, []);
  if (!usage) return <Skeleton className="mt-2 h-5" />;
  if (!usage.configured) return <p className="mt-2 text-xs text-muted">Tutor not configured on this deployment.</p>;
  return (
    <p className="mt-2 text-sm">
      <Sparkles size={13} className="mr-1 inline text-pro" aria-hidden />
      {usage.used}/{usage.quota} requests used today
    </p>
  );
}
