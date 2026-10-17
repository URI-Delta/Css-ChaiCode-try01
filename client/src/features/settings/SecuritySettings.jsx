import { useEffect, useState } from 'react';
import api, { errMessage } from '../../services/api.js';
import { Card, Input, Modal } from '../../components/common/ui.jsx';
import Button from '../../components/common/Button.jsx';
import { useAuthStore } from '../../store/authStore.js';
import { useUIStore } from '../../store/uiStore.js';
import { MonitorSmartphone } from 'lucide-react';

export default function SecuritySettings() {
  const logout = useAuthStore((s) => s.logout);
  const toast = useUIStore((s) => s.toast);
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [sessions, setSessions] = useState(null);
  const [revoking, setRevoking] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const loadSessions = () => api.get('/api/v1/me/sessions').then(({ data }) => setSessions(data.sessions)).catch(() => setSessions([]));
  useEffect(() => { loadSessions(); /* eslint-disable-line */ }, []);

  const changePassword = async () => {
    setFormError(null);
    if (form.next !== form.confirm) {
      setFormError('New passwords do not match');
      return;
    }
    setSaving(true);
    try {
      await api.post('/api/v1/me/password/change', { current: form.current, next: form.next });
      toast('Password changed — please sign in again', 'success');
      await logout();
      window.location.assign('/login');
    } catch (err) {
      setFormError(errMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const revokeAll = async () => {
    setConfirmOpen(false);
    setRevoking(true);
    try {
      await api.post('/api/v1/me/sessions/revoke-all');
      toast('All sessions revoked', 'success');
      await logout();
      window.location.assign('/login');
    } catch (err) {
      toast(errMessage(err), 'error');
    } finally {
      setRevoking(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight">Security</h1>
      <p className="mt-1 text-sm text-muted">Password and active sessions.</p>

      <Card className="mt-5 grid gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Change password</h2>
        {formError && <p className="text-xs text-error" role="alert">{formError}</p>}
        <Input label="Current password" type="password" autoComplete="current-password" value={form.current} onChange={(e) => setForm((f) => ({ ...f, current: e.target.value }))} />
        <Input label="New password" type="password" autoComplete="new-password" placeholder="8+ chars, 1 uppercase, 1 number" value={form.next} onChange={(e) => setForm((f) => ({ ...f, next: e.target.value }))} />
        <Input label="Confirm new password" type="password" autoComplete="new-password" value={form.confirm} onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))} />
        <Button onClick={changePassword} loading={saving}>Update password</Button>
        <p className="text-[11px] text-muted">Changing your password signs out every device holding a session for this account.</p>
      </Card>

      <Card className="mt-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted">
          <MonitorSmartphone size={15} /> Active sessions
        </h2>
        {sessions == null ? (
          <p className="mt-2 text-xs text-muted">Loading…</p>
        ) : (
          <>
            <ul className="mt-3 grid gap-2 text-sm">
              {sessions.map((s) => (
                <li key={s.tokenHash || s.createdAt} className="rounded-lg border border-line bg-surface p-3">
                  <div className="truncate font-mono text-[11px] text-muted">{s.device?.userAgent?.slice(0, 80) || 'Unknown device'}</div>
                  <div className="mt-0.5 text-xs text-muted">
                    signed in {new Date(s.createdAt).toLocaleString()} · expires {new Date(s.expiresAt).toLocaleDateString()}
                  </div>
                </li>
              ))}
              {!sessions.length && <li className="text-xs text-muted">No active sessions found (you're on a fresh login).</li>}
            </ul>
            <Button variant="danger" size="sm" className="mt-3" onClick={() => setConfirmOpen(true)} loading={revoking}>
              Revoke all sessions
            </Button>
          </>
        )}
      </Card>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Revoke all sessions?"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setConfirmOpen(false)}>Cancel</button>
            <button className="btn btn-danger" onClick={revokeAll}>Revoke everything</button>
          </>
        }
      >
        <p className="text-sm text-muted">Every signed-in device (including this one) will be signed out immediately.</p>
      </Modal>
    </div>
  );
}
