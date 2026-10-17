import { useEffect, useState } from 'react';
import api, { errMessage } from '../../services/api.js';
import { Card, Skeleton } from '../../components/common/ui.jsx';
import { Metric, AdminError } from './shared.jsx';
import { Link } from 'react-router-dom';

export default function AdminOverview() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/api/v1/admin/overview').then(({ data }) => setData(data.overview)).catch((err) => setError(errMessage(err)));
  }, []);

  if (error) return <AdminError message={error} />;
  if (!data) {
    return (
      <div className="grid gap-3 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Registered users" value={data.users.total} hint={`+${data.users.newLast7} in last 7 days`} />
        <Metric label="Active (7d logins)" value={data.users.activeLast7} />
        <Metric label="Pro subscribers" value={data.users.pro} tone="text-pro" hint={`admins: ${data.users.admins}`} />
        <Metric label="Projects saved" value={data.content.projects} />
        <Metric label="Published lessons" value={data.content.lessons} />
        <Metric label="Published challenges" value={data.content.challenges} />
        <Metric label="Today: challenge attempts" value={data.today.challengeAttempts} />
        <Metric label="Today: AI requests" value={data.today.aiRequests} hint={data.today.aiCostUsd ? `$${data.today.aiCostUsd.toFixed(3)} est.` : undefined} />
      </div>

      <Card>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Recent audit events</h2>
        {data.recentAudit?.length ? (
          <ul className="mt-3 grid gap-1.5 text-sm">
            {data.recentAudit.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2">
                <span className="font-mono text-xs text-brand">{a.action}</span>
                <span className="text-xs text-muted">{a.actorEmail || 'system'}</span>
                <span className="text-xs text-muted">→ {a.targetType} {a.targetId?.slice(-6)}…</span>
                <span className="ml-auto text-[11px] text-muted">{new Date(a.at).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted">No audit events yet.</p>
        )}
        <Link to="/admin/audit-logs" className="mt-3 inline-block text-xs text-brand hover:underline">View full audit log →</Link>
      </Card>
    </div>
  );
}
