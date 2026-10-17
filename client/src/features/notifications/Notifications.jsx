import { useEffect, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import api, { errMessage } from '../../services/api.js';
import { Card, Badge, EmptyState, Skeleton } from '../../components/common/ui.jsx';
import Button from '../../components/common/Button.jsx';
import { useUIStore } from '../../store/uiStore.js';

export default function Notifications() {
  const [state, setState] = useState({ loading: true, data: null, error: null });
  const toast = useUIStore((s) => s.toast);

  const load = () => api.get('/api/v1/me/notifications').then(({ data }) => setState({ loading: false, data, error: null })).catch((err) => setState({ loading: false, data: null, error: errMessage(err) }));
  useEffect(() => { load(); /* eslint-disable-line */ }, []);

  const markRead = async () => {
    try {
      await api.post('/api/v1/me/notifications/read');
      toast('All marked read', 'success');
      load();
    } catch (err) {
      toast(errMessage(err), 'error');
    }
  };

  if (state.loading) return <div className="mx-auto max-w-2xl"><Skeleton className="h-40" /></div>;
  if (state.error) return <EmptyState icon="⚠️" title="Couldn't load notifications" description={state.error} />;

  const { notifications, unread } = state.data;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell size={18} className="text-brand" aria-hidden />
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          {unread > 0 && <Badge tone="brand">{unread} new</Badge>}
        </div>
        {unread > 0 && <Button size="sm" variant="secondary" onClick={markRead}><CheckCheck size={14} /> Mark all read</Button>}
      </div>

      {!notifications.length ? (
        <EmptyState icon="📭" title="Nothing yet" description="Achievements, billing events and system updates will land here." />
      ) : (
        <div className="mt-5 grid gap-2">
          {notifications.map((n) => (
            <Card key={n.id} className={`!p-4 ${n.readAt ? 'opacity-60' : 'border-brand/30'}`}>
              <div className="flex items-center gap-2">
                {!n.readAt && <span className="h-2 w-2 rounded-full bg-brand" aria-hidden />}
                <span className="font-medium">{n.title}</span>
                <span className="ml-auto text-[11px] text-muted">{new Date(n.createdAt).toLocaleString()}</span>
              </div>
              <p className="mt-1 text-sm text-muted">{n.message}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
