import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FileCode2, Trash2 } from 'lucide-react';
import api, { errMessage } from '../../services/api.js';
import { Card, EmptyState, Spinner } from '../../components/common/ui.jsx';
import Button from '../../components/common/Button.jsx';
import CodeEditor from '../../components/editor/CodeEditor.jsx';
import SandboxPreview from '../playground/SandboxPreview.jsx';
import { useUIStore } from '../../store/uiStore.js';

function MyProjectsList() {
  const [data, setData] = useState(null);
  const navigate = useNavigate();
  const toast = useUIStore((s) => s.toast);

  const load = () => api.get('/api/v1/projects/me').then(({ data }) => setData(data)).catch((e) => toast(errMessage(e), 'error'));
  useEffect(() => { load(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, []);

  const del = async (id) => {
    try {
      await api.delete(`/api/v1/projects/${id}`);
      toast('Project deleted', 'success');
      load();
    } catch (err) {
      toast(errMessage(err), 'error');
    }
  };

  if (!data) return <div className="grid place-items-center py-20"><Spinner /></div>;
  if (!data.items.length) {
    return (
      <EmptyState
        icon="📂"
        title="No saved projects yet"
        description='Fork a starter project or save something from the playground, and it appears here.'
        action={<Link to="/projects" className="btn btn-primary btn-sm">Browse projects</Link>}
      />
    );
  }
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {data.items.map((p) => (
        <Card key={p.id} className="flex flex-col">
          <div className="flex items-center gap-3">
            <FileCode2 size={18} className="text-brand" aria-hidden />
            <div className="min-w-0 flex-1">
              <h2 className="truncate font-semibold">{p.title}</h2>
              <div className="text-[11px] text-muted">
                {p.templateSlug ? `from ${p.templateSlug}` : 'freehand'} · updated {new Date(p.updatedAt).toLocaleDateString()}
                {p.shareSlug && ' · shared'}
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => del(p.id)} aria-label={`Delete ${p.title}`} title="Delete project">
              <Trash2 size={15} />
            </button>
          </div>
          <button className="btn btn-secondary btn-sm mt-3" onClick={() => navigate(`/my-projects/${p.id}`)}>Open workspace</button>
        </Card>
      ))}
    </div>
  );
}

function ProjectEditor({ id }) {
  const [state, setState] = useState({ loading: true, project: null, error: null, saving: false });
  const [activeTab, setActiveTab] = useState('html');
  const toast = useUIStore((s) => s.toast);

  const load = () => {
    api.get(`/api/v1/projects/${id}`)
      .then(({ data }) => {
        setState((s) => ({ ...s, loading: false, project: data.project, error: null }));
      })
      .catch((err) => setState({ loading: false, project: null, error: errMessage(err) }));
  };
  useEffect(load, [id]);

  const patch = async (files, title) => {
    setState((s) => ({ ...s, saving: true }));
    try {
      const { data } = await api.patch(`/api/v1/projects/${id}`, { files, ...(title ? { title } : {}) });
      setState((s) => ({ ...s, saving: false, project: data.project }));
    } catch (err) {
      setState((s) => ({ ...s, saving: false }));
      toast(errMessage(err), 'error');
    }
  };

  if (state.loading) return <div className="grid place-items-center py-20"><Spinner /></div>;
  if (state.error) return <EmptyState icon="⚠️" title="Not available" description={state.error} />;

  const p = state.project;
  return (
    <div className="mx-auto max-w-6xl">
      <Link to="/my-projects" className="text-xs text-muted hover:text-text">← My projects</Link>
      <div className="mt-2 flex items-center gap-3">
        <input
          aria-label="Project title"
          className="input-base max-w-md text-lg font-semibold"
          value={p.title}
          onChange={(e) => setState((s) => ({ ...s, project: { ...p, title: e.target.value } }))}
          onBlur={(e) => patch(p.files, e.target.value)}
        />
        <Button size="sm" onClick={() => patch(p.files)} loading={state.saving}>Save</Button>
        {p.shareSlug && (
          <button className="btn btn-secondary btn-sm" onClick={async () => { await navigator.clipboard.writeText(`${window.location.origin}/playground/shared/${p.shareSlug}`); toast('Share link copied', 'success'); }}>
            Copy share link
          </button>
        )}
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <Card className="!p-0 overflow-hidden">
          <div className="flex gap-1 border-b border-line px-2 py-1.5">
            {['html', 'css', 'js'].map((l) => (
              <button key={l} className={`btn btn-ghost btn-sm font-mono uppercase ${activeTab === l ? 'text-brand' : ''}`} onClick={() => setActiveTab(l)}>{l}</button>
            ))}
          </div>
          <div style={{ height: 340 }}>
            <CodeEditor
              value={p.files?.[activeTab] || ''}
              language={activeTab}
              onChange={(v) => setState((s) => ({ ...s, project: { ...p, files: { ...p.files, [activeTab]: v } } }))}
              height="100%"
            />
          </div>
        </Card>
        <div style={{ height: 400 }}>
          <SandboxPreview html={p.files?.html} css={p.files?.css} js={p.files?.js} />
        </div>
      </div>
    </div>
  );
}

export default function MyProjects() {
  const { id } = useParams();
  return id ? <ProjectEditor id={id} /> : <MyProjectsList />;
}
