import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Lock } from 'lucide-react';
import api, { errMessage } from '../../services/api.js';
import { Card, Badge, Skeleton, EmptyState } from '../../components/common/ui.jsx';
import { useAuthStore } from '../../store/authStore.js';

export default function TrackDetail() {
  const { trackSlug } = useParams();
  const user = useAuthStore((s) => s.user);
  const [state, setState] = useState({ loading: true, data: null, error: null, visited: [] });

  useEffect(() => {
    Promise.all([
      api.get(`/api/v1/tracks/${trackSlug}`),
      user ? api.get('/api/v1/progress/me').catch(() => null) : Promise.resolve(null),
    ])
      .then(([trackRes, progRes]) => {
        setState({
          loading: false,
          data: trackRes.data,
          error: null,
          visited: progRes?.data?.stats?.recent?.map((r) => r.slug) || [],
        });
      })
      .catch((err) => setState({ loading: false, data: null, error: errMessage(err) }));
  }, [trackSlug, user]);

  if (state.loading) return <div className="mx-auto max-w-4xl"><Skeleton className="h-40" /><Skeleton className="mt-4 h-64" /></div>;
  if (state.error) return <EmptyState icon="⚠️" title="Track not available" description={state.error} />;

  const { track, lessons } = state.data;

  return (
    <div className="mx-auto max-w-4xl">
      <Link to="/learn" className="text-xs text-muted hover:text-text">← All tracks</Link>
      <div className="mt-3 flex items-start gap-4">
        <span className="text-4xl" aria-hidden>{track.emoji}</span>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{track.title}</h1>
            {track.accessLevel === 'pro' && <Badge tone="pro">Pro</Badge>}
          </div>
          <p className="mt-1 max-w-xl text-sm text-muted">{track.description}</p>
        </div>
      </div>

      <ol className="mt-6 grid gap-2">
        {lessons.map((l, i) => {
          const locked = l.accessLevel === 'pro' && user?.plan !== 'pro';
          const visited = state.visited.includes(l.slug);
          return (
            <li key={l.id}>
              <Card className="group flex items-center gap-4 !p-4 transition-colors hover:border-brand/50">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-elevated font-mono text-xs text-brand">{i + 1}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link to={`/lesson/${l.slug}`} className="truncate font-medium group-hover:text-brand">{l.title}</Link>
                    {l.accessLevel === 'pro' && <Lock size={13} className="shrink-0 text-pro" aria-label="Pro lesson" />}
                    {visited && <span className="shrink-0 text-[10px] text-success">✓ visited</span>}
                  </div>
                  <div className="mt-0.5 flex gap-2 text-[11px] text-muted">
                    <span>{l.difficulty}</span>·<span>~{l.estimatedMinutes} min</span>
                    {l.visualizer && <span>· has visualizer</span>}
                  </div>
                </div>
                {locked ? (
                  <Link to="/pricing" className="btn btn-pro btn-sm">Unlock</Link>
                ) : (
                  <Link to={`/lesson/${l.slug}`} className="btn btn-secondary btn-sm">{visited ? 'Revisit' : 'Start'}</Link>
                )}
              </Card>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
