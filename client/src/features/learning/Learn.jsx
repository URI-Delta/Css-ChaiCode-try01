import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMessage } from '../../services/api.js';
import { Card, Badge, Skeleton, EmptyState } from '../../components/common/ui.jsx';
import { useAuthStore } from '../../store/authStore.js';

export default function Learn() {
  const [tracks, setTracks] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(null);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    api.get('/api/v1/tracks').then(({ data }) => setTracks(data.tracks)).catch((err) => setError(errMessage(err)));
    if (user) api.get('/api/v1/progress/me').then(({ data }) => setProgress(data.stats)).catch(() => {});
  }, [user]);

  if (error) return <EmptyState icon="⚠️" title="Failed to load tracks" description={error} />;

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-bold tracking-tight">Learning tracks</h1>
      <p className="mt-1 text-sm text-muted">Six structured tracks. Start at the top — each track builds directly on the last.</p>

      {!tracks && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44" />)}
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tracks?.map((t) => {
          const stat = progress?.trackStats?.find((s) => s.trackId === String(t.id));
          const pct = stat && stat.total ? Math.round((stat.completed / stat.total) * 100) : 0;
          return (
            <Link key={t.id} to={`/learn/${t.slug}`} className="group">
              <Card className="h-full transition-colors hover:border-brand/60">
                <div className="flex items-start justify-between">
                  <span className="text-3xl" aria-hidden>{t.emoji}</span>
                  {t.accessLevel === 'pro' ? <Badge tone="pro">Pro</Badge> : <Badge>Free</Badge>}
                </div>
                <h2 className="mt-3 font-semibold group-hover:text-brand">{t.title}</h2>
                <p className="mt-1.5 line-clamp-2 text-sm text-muted">{t.description}</p>
                <div className="mt-4">
                  <div className="flex justify-between text-[11px] text-muted">
                    <span>{t.lessonsCount} lessons</span>
                    {stat && stat.completed > 0 && <span>{pct}% done</span>}
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-elevated">
                    <div className="h-full bg-brand" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
