import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import api, { errMessage } from '../../services/api.js';
import { Card, EmptyState, Skeleton, Badge } from '../../components/common/ui.jsx';
import { useUIStore } from '../../store/uiStore.js';

const TYPE_ROUTES = { lesson: (r) => `/lesson/${r.resourceId}` };

export default function Bookmarks() {
  const [list, setList] = useState(null);
  const [error, setError] = useState(null);
  const toast = useUIStore((s) => s.toast);

  const load = () => api.get('/api/v1/me/bookmarks').then(({ data }) => setList(data.bookmarks)).catch((err) => setError(errMessage(err)));
  useEffect(() => { load(); /* eslint-disable-line */ }, []);

  const remove = async (b) => {
    try {
      await api.delete('/api/v1/me/bookmarks', { data: { resourceType: b.resourceType, resourceId: b.resourceId } });
      setList((p) => p.filter((x) => x.id !== b.id));
      toast('Bookmark removed', 'success');
    } catch (err) {
      toast(errMessage(err), 'error');
    }
  };

  if (error) return <EmptyState icon="⚠️" title="Couldn't load bookmarks" description={error} />;
  if (!list) return <div className="mx-auto max-w-3xl"><Skeleton className="h-32" /><Skeleton className="mt-3 h-32" /></div>;
  if (!list.length) {
    return <EmptyState icon="🔖" title="No bookmarks yet" description="Bookmark lessons from the lesson page's bookmark icon to build your collection." />;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold tracking-tight">Bookmarks</h1>
      <div className="mt-5 grid gap-3">
        {list.map((b) => (
          <Card key={b.id} className="flex items-center gap-3 !p-4">
            <Badge>{b.resourceType}</Badge>
            <div className="min-w-0 flex-1">
              <Link to={TYPE_ROUTES[b.resourceType]?.(b) || '#'} className="truncate font-medium hover:text-brand">
                {b.meta?.title || b.resourceId}
              </Link>
              <div className="text-[11px] text-muted">saved {new Date(b.createdAt).toLocaleDateString()}</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => remove(b)} aria-label="Remove bookmark">
              <Trash2 size={15} />
            </button>
          </Card>
        ))}
      </div>
    </div>
  );
}
