import { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import api from '../../services/api.js';
import { Card, Skeleton, EmptyState } from '../../components/common/ui.jsx';

/** Public leaderboard: top learners by lessons completed + challenges passed.
 *  Backed by an aggregate endpoint; falls back to an informational empty state. */
export default function Leaderboard() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/api/v1/leaderboard')
      .then(({ data }) => setRows(data.rows))
      .catch((err) => setError(err?.response?.data?.error?.code === 'NOT_FOUND' ? 'disabled' : errMessage(err)));
  }, []);

  if (rows?.length === 0 || error === 'disabled') {
    return (
      <EmptyState
        icon="🏆"
        title="Leaderboard coming soon"
        description="Rankings appear once learners start completing lessons and challenges."
      />
    );
  }
  if (error) return <EmptyState icon="⚠️" title="Couldn't load leaderboard" description={error} />;
  if (!rows) return <div className="mx-auto max-w-2xl"><Skeleton className="h-64" /></div>;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight">Leaderboard</h1>
      <p className="mt-1 text-sm text-muted">Top learners this platform-wide, by lessons completed and challenges passed. Only first names are shown.</p>
      <Card className="mt-5">
        <ol className="grid gap-2">
          {rows.map((r, i) => (
            <li key={r.userId} className="flex items-center gap-3 rounded-lg border border-line bg-surface px-3 py-2">
              <span className="w-8 text-center font-mono text-sm text-muted">{i <= 2 ? ['🥇', '🥈', '🥉'][i] : i + 1}</span>
              <Trophy size={14} className="text-brand" aria-hidden />
              <span className="flex-1 font-medium">{r.name}</span>
              <span className="font-mono text-xs text-muted">{r.lessons} lessons · {r.challenges} challenges</span>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
