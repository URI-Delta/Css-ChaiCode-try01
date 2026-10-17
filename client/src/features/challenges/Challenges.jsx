import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Lock } from 'lucide-react';
import api, { errMessage } from '../../services/api.js';
import { Card, Badge, Skeleton, EmptyState } from '../../components/common/ui.jsx';
import { useAuthStore } from '../../store/authStore.js';
import clsx from 'clsx';

const TYPE_LABELS = {
  'fill-code': 'Fill the code',
  debug: 'Debug CSS',
  'visual-target': 'Visual target',
  responsive: 'Responsive',
  'multiple-choice': 'Quiz',
  'fill-blank': 'Fill the blank',
};

const FILTERS = ['all', 'beginner', 'intermediate', 'advanced'];

export default function Challenges() {
  const [list, setList] = useState(null);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    api.get('/api/v1/challenges').then(({ data }) => setList(data.challenges)).catch((err) => setError(errMessage(err)));
  }, []);

  if (error) return <EmptyState icon="⚠️" title="Failed to load challenges" description={error} />;
  const shown = list?.filter((c) => filter === 'all' || c.difficulty === filter);

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-bold tracking-tight">Challenges</h1>
      <p className="mt-1 text-sm text-muted">Automatic scoring happens on the server. You'll get per-requirement feedback — and solutions unlock after three attempts.</p>

      <div className="mt-4 flex gap-1.5">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={clsx('btn btn-sm', filter === f ? 'btn-primary' : 'btn-ghost')}>
            {f === 'all' ? 'All' : f}
          </button>
        ))}
      </div>

      {!shown && (
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      )}

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {shown?.map((c) => {
          const locked = c.accessLevel === 'pro' && user?.plan !== 'pro';
          return (
            <Link key={c.id} to={`/challenges/${c.slug}`} className="group">
              <Card className="h-full transition-colors hover:border-brand/50">
                <div className="flex items-center gap-2">
                  <Trophy size={16} className="text-brand" aria-hidden />
                  <h2 className="flex-1 truncate font-medium group-hover:text-brand">{c.title}</h2>
                  {locked && <Lock size={13} className="text-pro" aria-label="Pro challenge" />}
                </div>
                <p className="mt-1.5 line-clamp-2 text-xs text-muted">{c.description || 'Test your CSS skills against automated grading.'}</p>
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <Badge>{TYPE_LABELS[c.type]}</Badge>
                  <Badge tone={c.difficulty === 'advanced' ? 'error' : c.difficulty === 'intermediate' ? 'pro' : 'success'}>{c.difficulty}</Badge>
                  <span className="ml-auto font-mono text-[11px] text-muted">{c.points} pts</span>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
