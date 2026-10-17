import { useEffect, useState } from 'react';
import api, { errMessage } from '../../services/api.js';
import { Skeleton, Badge } from '../../components/common/ui.jsx';
import Button from '../../components/common/Button.jsx';
import { useUIStore } from '../../store/uiStore.js';
import { Table, th, td, AdminError } from './shared.jsx';

const TYPE_LABELS = {
  'fill-code': 'Fill code', debug: 'Debug', 'visual-target': 'Visual', responsive: 'Responsive',
  'multiple-choice': 'Quiz', 'fill-blank': 'Blank',
};

export default function AdminChallenges() {
  const [list, setList] = useState(null);
  const [error, setError] = useState(null);
  const toast = useUIStore((s) => s.toast);

  const load = () => api.get('/api/v1/admin/content').then(({ data }) => setList(data.challenges)).catch((err) => setError(errMessage(err)));
  useEffect(() => { load(); /* eslint-disable-line */ }, []);

  const patch = async (id, body) => {
    try {
      await api.patch(`/api/v1/admin/challenges/${id}`, body);
      load();
      toast('Challenge updated', 'success');
    } catch (err) {
      toast(errMessage(err), 'error');
    }
  };

  if (error) return <AdminError message={error} />;

  return (
    <div>
      {!list && <Skeleton className="h-72" />}
      {list && (
        <Table head={<tr>{['Challenge', 'Type', 'Difficulty', 'Points', 'Status', 'Access', 'Actions'].map((h, i) => th(h, i))}</tr>}>
          {list.map((c) => (
            <tr key={c._id} className="hover:bg-elevated/40">
              {td(c.title, 't')}
              {td(TYPE_LABELS[c.type] || c.type, 'ty', 'text-muted text-xs')}
              {td(c.difficulty, 'd', 'text-muted text-xs')}
              {td(c.points, 'p', 'font-mono text-xs')}
              {td(<Badge tone={c.status === 'published' ? 'success' : 'default'}>{c.status}</Badge>, 's')}
              {td(c.accessLevel, 'a', c.accessLevel === 'pro' ? 'text-pro' : 'text-muted')}
              {td(
                <div className="flex flex-wrap gap-1.5">
                  <Button size="sm" variant="secondary" onClick={() => patch(c._id, { status: c.status === 'published' ? 'draft' : 'published' })}>
                    {c.status === 'published' ? 'Unpublish' : 'Publish'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => patch(c._id, { accessLevel: c.accessLevel === 'pro' ? 'free' : 'pro' })}>
                    {c.accessLevel === 'pro' ? 'To free' : 'To pro'}
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
