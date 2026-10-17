import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { errMessage } from '../../services/api.js';
import { Card, Badge, Skeleton, EmptyState } from '../../components/common/ui.jsx';
import { useUIStore } from '../../store/uiStore.js';
import { useAuthStore } from '../../store/authStore.js';

const DIFF_TONES = { beginner: 'success', intermediate: 'pro', advanced: 'error' };

export default function Projects() {
  const user = useAuthStore((s) => s.user);
  const toast = useUIStore((s) => s.toast);
  const navigate = useNavigate();
  const [list, setList] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/api/v1/projects/templates').then(({ data }) => setList(data.templates)).catch((err) => setError(errMessage(err)));
  }, []);

  const fork = async (slug) => {
    if (!user) {
      toast('Sign in to fork projects into your workspace', 'warn');
      navigate('/login');
      return;
    }
    try {
      const { data } = await api.post('/api/v1/projects', { title: `My ${slug.replace(/-/g, ' ')}`, templateSlug: slug });
      toast('Starter forked into your workspace', 'success');
      navigate(`/my-projects/${data.project.id}`);
    } catch (err) {
      toast(errMessage(err), 'error');
    }
  };

  if (error) return <EmptyState icon="⚠️" title="Failed to load projects" description={error} />;

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-bold tracking-tight">Guided projects</h1>
      <p className="mt-1 text-sm text-muted">Fork any starter into your own workspace — your code saves as you go, and you resume later.</p>

      {!list && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list?.map((t) => (
          <Card key={t.id} className="flex h-full flex-col">
            <div className="flex items-start justify-between">
              <span className="text-2xl" aria-hidden>{t.emoji}</span>
              <Badge tone={DIFF_TONES[t.difficulty]}>{t.difficulty}</Badge>
            </div>
            <h2 className="mt-3 font-semibold">{t.title}</h2>
            <p className="mt-1 line-clamp-2 text-xs text-muted">{t.description}</p>
            <div className="mt-2 text-[11px] text-muted">{t.requirements?.length || 0} requirements · ~{t.estimatedMinutes} min</div>
            <div className="mt-auto grid grid-cols-2 gap-2 pt-4">
              <Link to={`/projects/${t.slug}`} className="btn btn-secondary btn-sm">Preview</Link>
              <button className="btn btn-primary btn-sm" onClick={() => fork(t.slug)}>Fork & build</button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
