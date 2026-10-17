import { useEffect, useState } from 'react';
import api, { errMessage } from '../../services/api.js';
import { Skeleton, Badge } from '../../components/common/ui.jsx';
import Button from '../../components/common/Button.jsx';
import { Table, th, td, AdminError } from './shared.jsx';

export default function AdminAuditLogs() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [action, setAction] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    api.get('/api/v1/admin/audit-logs', { params: { page, limit: 30, action } })
      .then(({ data }) => setData(data))
      .catch((err) => setError(errMessage(err)));
  }, [page, action]);

  if (error) return <AdminError message={error} />;
  if (!data) return <Skeleton className="h-72" />;

  return (
    <div className="grid gap-3">
      <div className="flex gap-2">
        <input className="input-base max-w-xs" placeholder="Filter by action (e.g. user, lesson)…" value={action} onChange={(e) => { setPage(1); setAction(e.target.value); }} />
        <span className="ml-auto self-center text-xs text-muted">{data.total} events</span>
      </div>

      <Table head={<tr>{['When', 'Actor', 'Action', 'Target'].map((h, i) => th(h, i))}</tr>}>
        {data.items.map((a) => (
          <tr key={a.id || a._id}>
            {td(new Date(a.at).toLocaleString(), 'w', 'text-xs text-muted font-mono')}
            {td(a.actorEmail || a.actorId?.email || 'system', 'ac', 'text-xs')}
            {td(<Badge>{a.action}</Badge>, 'act')}
            {td(`${a.targetType} ${a.targetId?.slice(0, 10) || ''}`, 'tg', 'font-mono text-[11px] text-muted')}
          </tr>
        ))}
        {!data.items.length && <tr><td colSpan={4} className="px-3 py-6 text-center text-sm text-muted">No audit events match the filter.</td></tr>}
      </Table>

      <div className="flex items-center justify-between text-xs text-muted">
        <span>page {data.page}/{data.pages}</span>
        <div className="flex gap-1.5">
          <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
          <Button size="sm" variant="secondary" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      </div>
    </div>
  );
}
