import { useEffect, useState } from 'react';
import api, { errMessage } from '../../services/api.js';
import { Card, Skeleton, Badge } from '../../components/common/ui.jsx';
import Button from '../../components/common/Button.jsx';
import { useUIStore } from '../../store/uiStore.js';
import { AdminError } from './shared.jsx';

export default function AdminSubscriptions() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [savingId, setSavingId] = useState(null);
  const toast = useUIStore((s) => s.toast);

  const load = () => api.get('/api/v1/admin/plans').then(({ data }) => setData(data)).catch((err) => setError(errMessage(err)));
  useEffect(() => { load(); /* eslint-disable-line */ }, []);

  const save = async (plan) => {
    const patch = drafts[plan._id] || {};
    setSavingId(plan._id);
    try {
      await api.patch(`/api/v1/admin/plans/${plan._id}`, patch);
      toast(`${plan.title} saved`, 'success');
      setDrafts((d) => ({ ...d, [plan._id]: {} }));
      load();
    } catch (err) {
      toast(errMessage(err), 'error');
    } finally {
      setSavingId(null);
    }
  };

  if (error) return <AdminError message={error} />;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {!data && <Skeleton className="h-72" />}
      {data?.plans?.map((p) => {
        const d = drafts[p._id] || {};
        const val = (k, fallback) => (d[k] ?? p[k] ?? fallback);
        return (
          <Card key={p._id}>
            <div className="flex items-center justify-between">
              <span className="font-semibold">{p.title}</span>
              <Badge tone={p.active ? 'success' : 'default'}>{p.active ? 'active' : 'hidden'}</Badge>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2.5 text-sm">
              <label className="grid gap-1">
                <span className="text-xs text-muted">Price</span>
                <input type="number" min="0" step="0.5" className="input-base" value={val('price', 0)} onChange={(e) => setDrafts((s) => ({ ...s, [p._id]: { ...s[p._id], price: Number(e.target.value) } }))} />
              </label>
              <label className="grid gap-1">
                <span className="text-xs text-muted">Currency</span>
                <input className="input-base" value={val('currency', 'USD')} onChange={(e) => setDrafts((s) => ({ ...s, [p._id]: { ...s[p._id], currency: e.target.value } }))} />
              </label>
              <label className="grid gap-1">
                <span className="text-xs text-muted">Billing interval</span>
                <select className="input-base" value={val('billingInterval', 'monthly')} onChange={(e) => setDrafts((s) => ({ ...s, [p._id]: { ...s[p._id], billingInterval: e.target.value } }))}>
                  {['monthly', 'yearly', 'lifetime'].map((i) => <option key={i}>{i}</option>)}
                </select>
              </label>
              <label className="grid gap-1">
                <span className="text-xs text-muted">AI daily quota</span>
                <input type="number" min="0" className="input-base" value={val('quotas', 0)} onChange={(e) => setDrafts((s) => ({ ...s, [p._id]: { ...s[p._id], quotas: Number(e.target.value) } }))} />
              </label>
            </div>
            <label className="mt-2.5 grid gap-1 text-sm">
              <span className="text-xs text-muted">Marketing features (one per line)</span>
              <textarea className="input-base min-h-24" value={(d.features ?? p.features ?? []).join('\n')} onChange={(e) => setDrafts((s) => ({ ...s, [p._id]: { ...s[p._id], features: e.target.value.split('\n') } }))} />
            </label>
            <div className="mt-3 flex items-center gap-2">
              <Button size="sm" variant="secondary" onClick={() => { setDrafts((s) => ({ ...s, [p._id]: { ...s[p._id], active: !p.active } })); save({ ...p, active: !p.active }); }} loading={savingId === p._id ? false : undefined}>
                {p.active ? 'Set hidden' : 'Activate'}
              </Button>
              <Button size="sm" className="ml-auto" loading={savingId === p._id} onClick={() => save(p)}>Save plan</Button>
            </div>
          </Card>
        );
      })}
      <p className="text-xs text-muted lg:col-span-2">
        Entitlement enforcement remains server-side: free users can access only free accessLevel content; pro unlocks all. Plan edits affect what /pricing displays and checkout pricing shown to the provider at purchase.
      </p>
    </div>
  );
}
