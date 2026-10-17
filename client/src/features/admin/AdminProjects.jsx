import { useEffect, useState } from 'react';
import api, { errMessage } from '../../services/api.js';
import { Skeleton, Badge } from '../../components/common/ui.jsx';
import Button from '../../components/common/Button.jsx';
import { useUIStore } from '../../store/uiStore.js';
import { Table, th, td, AdminError } from './shared.jsx';

export default function AdminProjects() {
  const [list, setList] = useState(null);
  const [error, setError] = useState(null);
  const toast = useUIStore((s) => s.toast);

  const load = () => api.get('/api/v1/admin/content').then(({ data }) => setList(data.projects)).catch((err) => setError(errMessage(err)));
  useEffect(() => { load(); /* eslint-disable-line */ }, []);

  const patch = async (id, body) => {
    try {
      await api.patch(`/api/v1/admin/projects/${id}`, body);
      load();
      toast('Project updated', 'success');
    } catch (err) {
      toast(errMessage(err), 'error');
    }
  };

  if (error) return <AdminError message={error} />;

  return (
    <div>
      {!list && <Skeleton className="h-72" />}
      {list && (
        <Table head={<tr>{['Project', 'Difficulty', 'Status', 'Access', 'Actions'].map((h, i) => th(h, i))}</tr>}>
          {list.map((p) => (
            <tr key={p._id} className="hover:bg-elevated/40">
              {td(p.title, 't')}
              {td(p.difficulty, 'd', 'text-muted text-xs')}
              {td(<Badge tone={p.status === 'published' ? 'success' : 'default'}>{p.status}</Badge>, 's')}
              {td(p.accessLevel, 'a', p.accessLevel === 'pro' ? 'text-pro' : 'text-muted')}
              {td(
                <div className="flex flex-wrap gap-1.5">
                  <Button size="sm" variant="secondary" onClick={() => patch(p._id, { status: p.status === 'published' ? 'draft' : 'published' })}>
                    {p.status === 'published' ? 'Unpublish' : 'Publish'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => patch(p._id, { accessLevel: p.accessLevel === 'pro' ? 'free' : 'pro' })}>
                    {p.accessLevel === 'pro' ? 'To free' : 'To pro'}
                  </Button>
                </div>,
                'act'
              )}
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
