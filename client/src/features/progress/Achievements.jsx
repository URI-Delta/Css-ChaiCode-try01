import { useEffect, useState } from 'react';
import api, { errMessage } from '../../services/api.js';
import { Card, Skeleton, EmptyState, Badge } from '../../components/common/ui.jsx';
import clsx from 'clsx';

export default function Achievements() {
  const [list, setList] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/api/v1/achievements/me').then(({ data }) => setList(data.achievements)).catch((err) => setError(errMessage(err)));
  }, []);

  if (error) return <EmptyState icon="⚠️" title="Couldn't load badges" description={error} />;

  const earned = list?.filter((a) => a.awardedAt).length ?? 0;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Achievements</h1>
          <p className="mt-1 text-sm text-muted">Milestones unlock automatically as your real numbers grow.</p>
        </div>
        {list && <Badge tone="brand">{earned}/{list.length} earned</Badge>}
      </div>

      {!list && <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-3">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        {list?.map((a) => {
          const done = Boolean(a.awardedAt);
          return (
            <Card key={a.id} className={clsx('text-center transition-opacity', !done && 'opacity-45')}>
              <div className={clsx('text-4xl', done && 'grayscale-0')} aria-hidden>{a.icon}</div>
              <div className="mt-2 font-semibold">{a.title}</div>
              <div className="mt-1 text-xs text-muted">{a.description}</div>
              <div className="mt-2 text-[10px] uppercase tracking-wider">
                {done ? (
                  <span className="text-success">earned {new Date(a.awardedAt).toLocaleDateString()}</span>
                ) : (
                  <span className="text-muted">locked</span>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
