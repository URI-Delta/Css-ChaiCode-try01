import { useEffect, useState } from 'react';
import api, { errMessage } from '../../services/api.js';
import { Skeleton, Badge } from '../../components/common/ui.jsx';
import Button from '../../components/common/Button.jsx';
import { Modal, ConfirmDialog } from '../../components/common/ui.jsx';
import { useUIStore } from '../../store/uiStore.js';
import { Table, th, td, AdminError } from './shared.jsx';

export default function AdminUsers() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [plan, setPlan] = useState('');
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState(null);
  const [suspendTarget, setSuspendTarget] = useState(null);
  const toast = useUIStore((s) => s.toast);

  const load = () => {
    api.get('/api/v1/admin/users', { params: { q, status, plan, page, limit: 12 } })
      .then(({ data }) => setData(data))
      .catch((err) => setError(errMessage(err)));
  };
  useEffect(load, [q, status, plan, page]);

  const viewUser = async (id) => {
    try {
      const { data } = await api.get(`/api/v1/admin/users/${id}`);
      setDetail(data);
    } catch (err) {
      toast(errMessage(err), 'error');
    }
  };

  const patchUser = async (id, patch) => {
    try {
      await api.patch(`/api/v1/admin/users/${id}`, patch);
      toast('User updated', 'success');
      setSuspendTarget(null);
      setDetail(null);
      load();
    } catch (err) {
      toast(errMessage(err), 'error');
    }
  };

  if (error) return <AdminError message={error} />;

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-2">
        <input className="input-base max-w-xs" placeholder="Search name or email…" value={q} onChange={(e) => { setPage(1); setQ(e.target.value); }} />
        <select className="select-like input-base w-36" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }} aria-label="Filter by status">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
        <select className="input-base w-32" value={plan} onChange={(e) => { setPage(1); setPlan(e.target.value); }} aria-label="Filter by plan">
          <option value="">All plans</option>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
        </select>
      </div>

      {!data && <Skeleton className="h-72" />}

      {data && (
        <>
          <Table head={<tr>{['User', 'Plan', 'Status', 'Joined', 'Last login', 'Actions'].map((h, i) => th(h, i))}</tr>}>
            {data.items.map((u) => (
              <tr key={u.id} className="hover:bg-elevated/40">
                {td(
                  <div>
                    <button className="font-medium hover:text-brand" onClick={() => viewUser(u.id)}>{u.name}</button>
                    <div className="text-[11px] text-muted">{u.email}</div>
                    {u.role === 'admin' && <Badge tone="pro" className="mt-0.5">admin</Badge>}
                  </div>,
                  'u'
                )}
                {td(<Badge tone={u.plan === 'pro' ? 'pro' : 'default'}>{u.plan}</Badge>, 'p')}
                {td(<Badge tone={u.status === 'suspended' ? 'error' : 'success'}>{u.status}</Badge>, 's')}
                {td(new Date(u.createdAt).toLocaleDateString(), 'c', 'text-muted text-xs')}
                {td(u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : '—', 'l', 'text-muted text-xs')}
                {td(
                  <div className="flex gap-1.5">
                    {u.status === 'active' ? (
                      <Button size="sm" variant="danger" onClick={() => setSuspendTarget(u)}>Suspend</Button>
                    ) : (
                      <Button size="sm" variant="secondary" onClick={() => patchUser(u.id, { status: 'active' })}>Reinstate</Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => patchUser(u.id, { plan: u.plan === 'pro' ? 'free' : 'pro' })}>
                      {u.plan === 'pro' ? 'To free' : 'Grant pro'}
                    </Button>
                  </div>,
                  'a'
                )}
              </tr>
            ))}
          </Table>
          <div className="flex items-center justify-between text-xs text-muted">
            <span>{data.total} users · page {data.page}/{data.pages}</span>
            <div className="flex gap-1.5">
              <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
              <Button size="sm" variant="secondary" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          </div>
        </>
      )}

      <Modal open={!!detail} onClose={() => setDetail(null)} title="User details" wide>
        {detail && (
          <div className="grid gap-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <InfoRow k="Name" v={detail.user.name} />
              <InfoRow k="Email" v={detail.user.email} />
              <InfoRow k="Role" v={detail.user.role} />
              <InfoRow k="Plan" v={detail.user.plan} />
              <InfoRow k="Status" v={detail.user.status} />
              <InfoRow k="Verified" v={detail.user.emailVerified ? 'yes' : 'no'} />
              <InfoRow k="Lessons completed" v={detail.stats.lessonsCompleted} />
              <InfoRow k="Challenges passed" v={detail.stats.challengesPassed} />
              <InfoRow k="Projects" v={detail.stats.projects} />
              {detail.subscription && <InfoRow k="Subscription" v={`${detail.subscription.status} via ${detail.subscription.provider}`} />}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!suspendTarget}
        title={`Suspend ${suspendTarget?.name}?`}
        body="Their sessions are revoked immediately and they can't sign in. You can reinstate any time."
        confirmLabel="Suspend user"
        danger
        onConfirm={() => patchUser(suspendTarget.id, { status: 'suspended' })}
        onCancel={() => setSuspendTarget(null)}
      />
    </div>
  );
}

function InfoRow({ k, v }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-2.5">
      <div className="text-[10px] uppercase tracking-wider text-muted">{k}</div>
      <div className="font-medium">{String(v ?? '—')}</div>
    </div>
  );
}
