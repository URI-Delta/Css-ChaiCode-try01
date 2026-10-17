import { useEffect, useState } from 'react';
import api, { errMessage } from '../../services/api.js';
import { Card, Skeleton, Badge } from '../../components/common/ui.jsx';
import Button from '../../components/common/Button.jsx';
import { useUIStore } from '../../store/uiStore.js';
import { AdminError } from './shared.jsx';

export default function AdminAiSettings() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const toast = useUIStore((s) => s.toast);

  const load = () => api.get('/api/v1/admin/plans').then(({ data }) => { setData(data); setDraft(data.aiConfig?.quotas || null); }).catch((err) => setError(errMessage(err)));
  useEffect(() => { load(); /* eslint-disable-line */ }, []);

  const save = async () => {
    setSaving(true);
    try {
      await api.patch('/api/v1/admin/ai-config', draft);
      toast('AI quotas saved', 'success');
      load();
    } catch (err) {
      toast(errMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  if (error) return <AdminError message={error} />;
  if (!data) return <Skeleton className="h-64" />;

  const quotaFields = [
    ['guest', 'Guest (anonymous)'],
    ['free', 'Free plan'],
    ['pro', 'Pro plan'],
    ['admin', 'Administrators'],
  ];

  return (
    <div className="grid max-w-2xl gap-4">
      <Card>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Daily AI tutor quotas</h2>
          <Badge>{data.aiConfig?.timezone || 'UTC'}</Badge>
        </div>
        <p className="mt-1 text-xs text-muted">Requests per calendar day, enforced server-side with an atomic counter — reloads and parallel requests can't bypass the cap.</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {quotaFields.map(([key, label]) => (
            <label key={key} className="grid gap-1 text-sm">
              <span className="text-xs text-muted">{label}</span>
              <input
                type="number"
                min="0"
                className="input-base"
                value={draft?.[key] ?? 0}
                onChange={(e) => setDraft((d) => ({ ...d, [key]: Number(e.target.value) }))}
              />
            </label>
          ))}
        </div>
        <label className="mt-3 grid gap-1 text-sm">
          <span className="text-xs text-muted">Timezone for the daily reset</span>
          <input className="input-base max-w-xs" value={draft?.timezone ?? 'UTC'} onChange={(e) => setDraft((d) => ({ ...d, timezone: e.target.value }))} />
        </label>
        <Button className="mt-4" onClick={save} loading={saving}>Save quotas</Button>
      </Card>
      <Card>
        <h3 className="text-sm font-semibold">Provider status</h3>
        <p className="mt-1 text-xs text-muted">
          Read-only here by design: <code className="font-mono">AI_PROVIDER</code> + <code className="font-mono">AI_API_KEY</code> live only in server env. Unconfigured deployments show a graceful "not configured" state in the tutor instead of failing.
        </p>
      </Card>
    </div>
  );
}
