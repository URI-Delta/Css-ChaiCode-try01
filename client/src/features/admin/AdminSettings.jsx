import { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import api, { errMessage } from '../../services/api.js';
import { Card, Badge, Skeleton } from '../../components/common/ui.jsx';
import Button from '../../components/common/Button.jsx';
import { useUIStore } from '../../store/uiStore.js';
import { AdminError } from './shared.jsx';

export default function AdminSettings() {
  const [aiConfig, setAiConfig] = useState(null);
  const [health, setHealth] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const toast = useUIStore((s) => s.toast);

  const load = () => {
    api.get('/api/v1/admin/plans').then(({ data }) => setAiConfig(data.aiConfig)).catch((err) => setError(errMessage(err)));
    api.get('/api/v1/health').then(({ data }) => setHealth(data)).catch(() => setHealth({ status: 'down' }));
  };
  useEffect(() => { load(); /* eslint-disable-line */ }, []);

  const toggleMaintenance = async () => {
    setSaving(true);
    try {
      const { data } = await api.patch('/api/v1/admin/ai-config', { maintenanceMode: !aiConfig.maintenanceMode });
      setAiConfig(data.config);
      toast(`Maintenance mode ${data.config.maintenanceMode ? 'enabled' : 'disabled'}`, 'info');
    } catch (err) {
      toast(errMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  if (error) return <AdminError message={error} />;

  return (
    <div className="grid max-w-2xl gap-4">
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Maintenance mode</h2>
            <p className="mt-1 text-xs text-muted">Signal for the API to stop accepting non-critical writes. (Clients read the flag from platform config.)</p>
          </div>
          {aiConfig ? <Button size="sm" variant={aiConfig.maintenanceMode ? 'danger' : 'secondary'} onClick={toggleMaintenance} loading={saving}>
            {aiConfig.maintenanceMode ? 'Disable' : 'Enable'}
          </Button> : <Skeleton className="h-9 w-24" />}
        </div>
        {aiConfig && <div className="mt-3"><Badge tone={aiConfig.maintenanceMode ? 'error' : 'success'}>{aiConfig.maintenanceMode ? 'maintenance ON' : 'operational'}</Badge></div>}
      </Card>

      <Card>
        <h2 className="flex items-center gap-2 font-semibold"><Activity size={16} className="text-success" /> System health</h2>
        {health ? (
          <div className="mt-3 grid gap-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">API status</span>
              <Badge tone={health.status === 'healthy' ? 'success' : 'error'}>{health.status}</Badge>
            </div>
            <div className="flex justify-between border-b-0">
              <span className="text-muted">Uptime</span>
              <span className="font-mono text-xs">{Math.floor(health.uptime / 60)}m {health.uptime % 60}s</span>
            </div>
          </div>
        ) : (
          <Skeleton className="mt-3 h-16" />
        )}
      </Card>

      <Card>
        <h2 className="font-semibold">Data & backups</h2>
        <p className="mt-1.5 text-xs leading-relaxed text-muted">
          MongoDB backups: take Atlas continuous snapshots in production, or scheduled <code className="font-mono">mongodump</code> locally. This deployment has no backup automation configured — see docs/deployment.md.
        </p>
      </Card>
    </div>
  );
}
