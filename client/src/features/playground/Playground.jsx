import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Play, RotateCcw, Save, Share2, Download, Upload, Monitor, Tablet, Smartphone, Columns2, Rows2, Pencil, FolderOpen } from 'lucide-react';
import CodeEditor from '../../components/editor/CodeEditor.jsx';
import SandboxPreview from './SandboxPreview.jsx';
import { Modal, EmptyState, Spinner } from '../../components/common/ui.jsx';
import Button from '../../components/common/Button.jsx';
import { useUIStore } from '../../store/uiStore.js';
import { useAuthStore } from '../../store/authStore.js';
import api, { errMessage } from '../../services/api.js';
import { Link } from 'react-router-dom';

const TEMPLATES = [
  { name: 'Blank', emoji: '📄', html: '<h1>Hello, CSS!</h1>', css: 'h1 { color: #ff7a45; }' },
  {
    name: 'Flexbox Centering',
    emoji: '🎯',
    html: '<div class="stage">\n  <div class="box">Center me</div>\n</div>',
    css: `.stage {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 90vh;
}
.box {
  padding: 24px 40px;
  background: #ff7a45;
  border-radius: 12px;
  color: #0d0e09;
  font-weight: 700;
}`,
  },
  {
    name: 'Card Grid',
    emoji: '🃏',
    html: '<div class="cards">\n  <div class="card">One</div>\n  <div class="card">Two</div>\n  <div class="card">Three</div>\n</div>',
    css: `.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}
.card {
  background: #1b1a15;
  border: 1px solid #302d25;
  border-radius: 12px;
  padding: 32px 12px;
  text-align: center;
}`,
  },
  {
    name: 'Keyframe Animation',
    emoji: '✨',
    html: '<div class="floaty">🌊</div>',
    css: `@keyframes float {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-16px); }
}
.floaty {
  width: 80px; height: 80px;
  display: grid; place-items: center;
  font-size: 40px;
  border-radius: 16px;
  background: #21201a;
  animation: float 2.4s ease-in-out infinite;
}`,
    js: '',
  },
  {
    name: 'Responsive Hero',
    emoji: '📱',
    html: '<section class="hero">\n  <h1>Responsive!</h1>\n  <p>Resize with the device buttons.</p>\n</section>',
    css: `body { margin: 0; }
.hero {
  text-align: center;
  padding: clamp(2rem, 8vw, 6rem) 1rem;
}
.hero h1 { font-size: clamp(1.8rem, 6vw, 4rem); margin: 0; color: #ff7a45; }`,
    js: '',
  },
];

const SIZES = { mobile: 375, tablet: 768, desktop: '100%' };

export default function Playground() {
  const user = useAuthStore((s) => s.user);
  const toast = useUIStore((s) => s.toast);
  const [files, setFiles] = useState({ html: TEMPLATES[0].html, css: TEMPLATES[0].css, js: '' });
  const [activeTab, setActiveTab] = useState('html');
  const [layout, setLayout] = useState('horizontal');
  const [device, setDevice] = useState('desktop');
  const [autoRun, setAutoRun] = useState(true);
  const [draft, setDraft] = useState({ html: TEMPLATES[0].html, css: TEMPLATES[0].css, js: '' }); // runs only on Run when autoRun off
  const [saved, setSaved] = useState(null);
  const [previewError, setPreviewError] = useState(null);
  const [showScripts, setShowScripts] = useState(false); // starter templates
  const [showProjectList, setShowProjectList] = useState(false);
  const [projects, setProjects] = useState(null);
  const [runId, setRunId] = useState(0);
  const dirty = useRef(false);

  const displayed = autoRun ? files : draft;

  useEffect(() => {
    if (autoRun) setDraft(files);
  }, [files, autoRun]);

  useEffect(() => {
    const handler = (e) => {
      if (dirty.current) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  const run = useCallback(() => {
    setDraft(files);
    setRunId((n) => n + 1);
    setPreviewError(null);
  }, [files]);

  useEffect(() => {
    if (autoRun) {
      const t = setTimeout(() => setRunId((n) => n + 1), 350);
      return () => clearTimeout(t);
    }
  }, [draft, autoRun]);

  const update = (lang) => (value) => {
    dirty.current = true;
    setFiles((f) => ({ ...f, [lang]: value }));
  };

  const save = async () => {
    if (!user) {
      toast('Sign in to save projects', 'warn');
      return;
    }
    try {
      const payload = { title: saved?.title || 'Playground project', files };
      const { data } = saved
        ? await api.patch(`/api/v1/projects/${saved.id}`, payload)
        : await api.post('/api/v1/projects', { ...payload, savedFromPlayground: true });
      setSaved(data.project);
      dirty.current = false;
      toast('Project saved', 'success');
    } catch (err) {
      toast(errMessage(err), 'error');
    }
  };

  const loadProjects = async (open = true) => {
    setShowScripts(false);
    setShowProjectList(open);
    if (!user) return;
    try {
      const { data } = await api.get('/api/v1/projects/me');
      setProjects(data);
    } catch (err) {
      toast(errMessage(err), 'error');
    }
  };

  const openProject = (p) => {
    setFiles({ html: p.files?.html || '', css: p.files?.css || '', js: p.files?.js || '' });
    setSaved(p);
    dirty.current = false;
    setShowProjectList(false);
    setRunId((n) => n + 1);
  };

  const share = async () => {
    if (!saved) {
      toast('Save the project first, then share it', 'info');
      return;
    }
    try {
      const { data } = await api.post(`/api/v1/projects/${saved.id}/share`);
      const url = `${window.location.origin}${data.shareUrl}`;
      await navigator.clipboard.writeText(url);
      toast('Read-only link copied to clipboard', 'success');
    } catch (err) {
      toast(errMessage(err), 'error');
    }
  };

  const download = () => {
    const blob = new Blob([`<!doctype html>\n<html>\n<head>\n<style>\n${files.css}\n</style>\n</head>\n<body>\n${files.html}\n<script>\n${files.js}\n</script>\n</body>\n</html>`], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${(saved?.title || 'css-visual-playground').replace(/\s+/g, '-').toLowerCase()}.html`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const htmlMatch = text.match(/<body>([\s\S]*?)(<script|<\/body>)/i);
    const cssMatch = text.match(/<style>([\s\S]*?)<\/style>/i);
    const jsMatch = text.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
    setFiles({ html: htmlMatch?.[1]?.trim() || text, css: cssMatch?.[1]?.trim() || '', js: jsMatch?.[1]?.trim() || '' });
    dirty.current = true;
    toast('Imported', 'success');
  };

  const templateList = useMemo(() => TEMPLATES, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-4">
      {/* toolbar */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h1 className="mr-2 text-lg font-semibold">Playground</h1>
        <Button size="sm" onClick={run} title="Run (also ⌘/Ctrl+Enter)">
          <Play size={14} /> Run
        </Button>
        <Button size="sm" variant="secondary" onClick={() => { setFiles({ html: '', css: '', js: '' }); setSaved(null); run(); }} title="Clear everything">
          <RotateCcw size={14} /> Reset
        </Button>
        <Button size="sm" variant="secondary" onClick={save}>
          <Save size={14} /> {saved ? 'Save' : 'Save project'}
        </Button>
        <Button size="sm" variant="secondary" onClick={share}>
          <Share2 size={14} /> Share
        </Button>
        <Button size="sm" variant="ghost" onClick={download} title="Download as single HTML file">
          <Download size={14} />
        </Button>
        <label className="btn btn-ghost btn-sm" title="Import an HTML file">
          <Upload size={14} />
          <input type="file" accept=".html,.htm" className="hidden" onChange={importFile} />
        </label>
        <Button size="sm" variant="ghost" onClick={() => loadProjects(true)} title="Open a saved project">
          <FolderOpen size={14} /> My projects
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setShowScripts(true)} title="Starter templates">
          ⚡ Templates
        </Button>

        <div className="ml-auto flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-muted">
            <input type="checkbox" checked={autoRun} onChange={(e) => setAutoRun(e.target.checked)} />
            auto-run
          </label>
          <div className="flex rounded-lg border border-line p-0.5">
            {[
              ['monitor', Monitor, 'desktop'],
              ['tablet', Tablet, 'tablet'],
              ['phone', Smartphone, 'mobile'],
            ].map(([name, Icon, val]) => (
              <button key={val} className={`btn btn-ghost btn-sm !p-1.5 ${device === val ? 'text-brand' : ''}`} onClick={() => setDevice(val)} aria-label={`Preview size: ${val}`}>
                <Icon size={15} />
              </button>
            ))}
          </div>
          <div className="flex rounded-lg border border-line p-0.5">
            {[
              [Columns2, 'horizontal'],
              [Rows2, 'vertical'],
            ].map(([Icon, val]) => (
              <button key={val} className={`btn btn-ghost btn-sm !p-1.5 ${layout === val ? 'text-brand' : ''}`} onClick={() => setLayout(val)} aria-label={`Layout: ${val}`}>
                <Icon size={15} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* main area */}
      <div className={layout === 'horizontal' ? 'grid h-[calc(100vh-11rem)] gap-3 md:grid-cols-2' : 'grid h-[calc(100vh-11rem)] gap-3 md:grid-rows-2'}>
        {/* editors */}
        <div className="card-surface flex min-h-0 flex-col overflow-hidden">
          <div className="flex items-center gap-1 border-b border-line px-2 py-1.5">
            {['html', 'css', 'js'].map((t) => (
              <button key={t} onClick={() => setActiveTab(t)} className={`btn btn-ghost btn-sm font-mono ${activeTab === t ? 'text-brand' : ''}`} aria-pressed={activeTab === t}>
                {t.toUpperCase()}
              </button>
            ))}
            {dirty.current && <span className="ml-auto text-[10px] text-pro">unsaved</span>}
          </div>
          <div className="min-h-0 flex-1 overflow-auto">
            <CodeEditor value={files[activeTab]} language={activeTab} onChange={update(activeTab)} height="100%" />
          </div>
        </div>

        {/* preview */}
        <div className="card-surface flex min-h-0 flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-3 py-1.5 text-[11px] text-muted">
            <span className="font-mono">
              preview {SIZES[device] !== '100%' ? `· ${SIZES[device]}px` : ''} {device !== 'desktop' ? '(scale-to-fit)' : ''} · sandboxed
            </span>
            {previewError ? (
              <span className="max-w-[60%] truncate text-error" title={previewError}>⚠ {previewError}</span>
            ) : (
              <span className="font-mono">run #{runId}</span>
            )}
          </div>
          <div className="grid min-h-0 flex-1 place-items-center overflow-auto bg-surface p-3">
            <div style={{ width: SIZES[device], height: device === 'desktop' ? '100%' : 640, maxWidth: '100%' }}>
              <SandboxPreview html={displayed.html} css={displayed.css} js={displayed.js} onError={setPreviewError} />
            </div>
          </div>
        </div>
      </div>

      {/* templates modal */}
      <Modal open={showScripts} onClose={() => setShowScripts(false)} title="Starter templates" wide>
        <div className="grid gap-2 sm:grid-cols-2">
          {templateList.map((t) => (
            <button
              key={t.name}
              className="card-surface flex items-start gap-3 p-3 text-left transition-colors hover:border-brand/50"
              onClick={() => {
                setFiles({ html: t.html, css: t.css, js: t.js || '' });
                setSaved(null);
                dirty.current = true;
                setShowScripts(false);
                run();
              }}
            >
              <span className="text-2xl" aria-hidden>{t.emoji}</span>
              <div>
                <div className="font-semibold">{t.name}</div>
                <div className="mt-0.5 line-clamp-2 text-[11px] text-muted">{t.css.replace(/\n+/g, ' ').slice(0, 90)}…</div>
              </div>
            </button>
          ))}
        </div>
      </Modal>

      {/* my projects modal */}
      <Modal open={showProjectList} onClose={() => setShowProjectList(false)} title="My projects" wide>
        {!user && (
          <EmptyState
            icon="🔐"
            title="Sign in to see your projects"
            description="Saved playground projects live in your account."
            action={<Link to="/login" className="btn btn-primary btn-sm">Sign in</Link>}
          />
        )}
        {user && (projects == null ? <Spinner /> : projects.items.length === 0 ? <EmptyState icon="📭" title="No saved projects yet" description="Save the current playground as your first project." /> : (
          <div className="grid gap-2">
            {projects.items.map((p) => (
              <div key={p.id} className="card-surface flex items-center gap-3 p-3">
                <Pencil size={15} className="text-muted" aria-hidden />
                <div className="flex-1">
                  <div className="font-semibold">{p.title}</div>
                  <div className="text-[11px] text-muted">updated {new Date(p.updatedAt).toLocaleString()}</div>
                </div>
                <Button size="sm" variant="secondary" onClick={() => openProject(p)}>Open</Button>
                <Button size="sm" variant="danger" onClick={async () => {
                  try {
                    await api.delete(`/api/v1/projects/${p.id}`);
                    const { data } = await api.get('/api/v1/projects/me');
                    setProjects(data);
                    toast('Project deleted', 'success');
                  } catch (err) {
                    toast(errMessage(err), 'error');
                  }
                }}>
                  Delete
                </Button>
              </div>
            ))}
          </div>
        ))}
      </Modal>
    </div>
  );
}
