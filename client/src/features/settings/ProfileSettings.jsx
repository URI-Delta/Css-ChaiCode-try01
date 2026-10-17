import { useState } from 'react';
import { useAuthStore } from '../../store/authStore.js';
import { Card, Input, Badge } from '../../components/common/ui.jsx';
import Button from '../../components/common/Button.jsx';
import { useUIStore } from '../../store/uiStore.js';
import { Link } from 'react-router-dom';

export default function ProfileSettings() {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const toast = useUIStore((s) => s.toast);
  const [form, setForm] = useState({ name: user?.name || '', bio: user?.bio || '' });
  const [saving, setSaving] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState(null);

  const save = async () => {
    setSaving(true);
    try {
      await updateUser(form);
      toast('Profile saved', 'success');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const resendVerification = async () => {
    try {
      const { data } = await (await import('../../services/api.js')).default.post('/api/v1/auth/verify-email/resend');
      setVerifyMsg(data.message || 'Check your inbox');
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
      <p className="mt-1 text-sm text-muted">How you appear inside CSS Visual.</p>

      <Card className="mt-5 grid gap-4">
        <Input label="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        <div className="grid gap-1.5">
          <label className="text-xs font-medium text-muted" htmlFor="bio">Bio</label>
          <textarea id="bio" className="input-base min-h-24" value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} placeholder="Frontend developer learning CSS the visual way…" />
        </div>
        <Input label="Email" value={user?.email || ''} disabled title="Email changes come from support for auditability" />
        <div className="flex items-center gap-2">
          {user?.emailVerified ? (
            <Badge tone="success">Email verified</Badge>
          ) : (
            <>
              <Badge tone="error" className="cursor-help">Email not verified</Badge>
              <button className="btn btn-secondary btn-sm" onClick={resendVerification}>Resend verification</button>
              {verifyMsg && <span className="text-xs text-muted">{verifyMsg}</span>}
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={save} loading={saving}>Save changes</Button>
          <Link to="/settings/security" className="btn btn-ghost btn-sm">Security →</Link>
        </div>
      </Card>
    </div>
  );
}
