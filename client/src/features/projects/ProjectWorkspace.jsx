import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { CheckSquare, Square, Eye, EyeOff, Lock } from 'lucide-react';
import CodeEditor from '../../components/editor/CodeEditor.jsx';
import SandboxPreview from '../playground/SandboxPreview.jsx';
import { Card, Badge, Skeleton, EmptyState, Modal } from '../../components/common/ui.jsx';
import Button from '../../components/common/Button.jsx';
import api, { errMessage } from '../../services/api.js';
import { useUIStore } from '../../store/uiStore.js';
import { useAuthStore } from '../../store/authStore.js';
import FrontendGrader from '../../components/common/FrontendGrader.jsx';

export default function ProjectWorkspace() {
  const { projectSlug } = useParams();
  const user = useAuthStore((s) => s.user);
  const toast = useUIStore((s) => s.toast);
  const navigate = useNavigate();
  const [state, setState] = useState({ loading: true, template: null, error: null });
  const [files, setFiles] = useState({ html: '', css: '', js: '' });
  const [activeTab, setActiveTab] = useState('html');
  const [ticked, setTicked] = useState({});
  const [showSolution, setShowSolution] = useState(false);
  const [solved, setSolved] = useState(false);

  useEffect(() => {
    api.get(`/api/v1/projects/templates/${projectSlug}`)
      .then(({ data }) => {
        setState({ loading: false, template: data.template, error: null });
        setFiles({ html: data.template.starterFiles?.html || '', css: data.template.starterFiles?.css || '', js: data.template.starterFiles?.js || '' });
        setFiles((f) => ({ ...f }));
      })
      .catch((err) => setState({ loading: false, template: null, error: errMessage(err) }));
  }, [projectSlug]);

  if (state.loading) return <div className="mx-auto max-w-6xl"><Skeleton className="h-12" /><Skeleton className="mt-4 h-96" /></div>;
  if (state.error) return <EmptyState icon="⚠️" title="Project not found" description={state.error} />;

  const t = state.template;
  const isPro = t.accessLevel === 'pro';

  if (isPro && user?.plan !== 'pro') {
    return (
      <div className="mx-auto max-w-4xl py-10">
        <EmptyState icon="🔒" title="Pro project" description="Fork this project to your workspace with a Pro plan." action={<Link to="/pricing" className="btn btn-pro btn-sm">See plans</Link>} />
      </div>
    );
  }

  const forkAndBuild = async () => {
    if (!user) {
      toast('Sign in to build projects in your workspace', 'warn');
      navigate('/login');
      return;
    }
    try {
      const { data } = await api.post('/api/v1/projects', { title: `My ${t.title}`, templateId: t.id });
      navigate(`/my-projects/${data.project.id}`);
    } catch (err) {
      toast(errMessage(err), 'error');
    }
  };

  /* light client-side completion checks; authoritative decisions remain server-side */
  const checkCompletion = (userFiles) => {
    if (!t.completionCriteria?.length) return true;
    const cssText = userFiles.css || '';
    return t.completionCriteria.some((crit) => {
      const re = new RegExp(`[^{]*${crit.selector || ''}\\s*\\{[^}]*${crit.property}\\s*:[^;}]*${(crit.values?.[0] || '').replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}`, 'i');
      return !crit.property || re.test(cssText);
    });
  };

  return (
    <div className="mx-auto max-w-6xl">
      <Link to="/projects" className="text-xs text-muted hover:text-text">← All projects</Link>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="text-2xl" aria-hidden>{t.emoji}</span>
        <h1 className="text-xl font-bold tracking-tight">{t.title}</h1>
        <Badge>{t.difficulty}</Badge>
        <span className="text-xs text-muted">~{t.estimatedMinutes} min</span>
        <Button size="sm" className="ml-auto" onClick={forkAndBuild}>Fork & build →</Button>
      </div>
      <p className="mt-1.5 max-w-2xl text-sm text-muted">{t.description}</p>

      <div className="mt-5 grid gap-4 lg:grid-cols-[300px_1fr]">
        {/* left rail */}
        <div className="grid content-start gap-4">
          <Card>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Objectives</h2>
            <ul className="mt-2 text-sm text-muted">
              {(t.objectives || []).map((o, i) => <li key={i} className="mt-1">▸ {o}</li>)}
            </ul>
          </Card>
          <Card>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Requirements</h2>
            <ul className="mt-2 grid gap-2 text-sm">
              {(t.requirements || []).map((r, i) => (
                <li key={i}>
                  <button className="flex w-full items-start gap-2 text-left" onClick={() => setTicked((p) => ({ ...p, [i]: !p[i] }))}>
                    {ticked[i] ? <CheckSquare size={15} className="mt-0.5 shrink-0 text-success" /> : <Square size={15} className="mt-0.5 shrink-0 text-muted" />}
                    <span className={ticked[i] ? 'text-muted line-through' : ''}>{r}</span>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Hints</h2>
            {(t.hints || []).length ? (
              <ul className="mt-2 grid gap-2 text-sm text-muted">
                {(t.hints || []).map((h, i) => <li key={i}>💡 {h}</li>)}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-muted">No hints — you've got this.</p>
            )}
            {t.completionCriteria?.length > 0 && (
              <p className="mt-3 text-xs text-muted">Progress tracker: <span className={solved ? 'text-success' : ''}>{solved ? 'criteria met ✓' : 'keep going'}</span></p>
            )}
            <CompletionChecker files={files} criteria={t.completionCriteria} onSolved={setSolved} />
          </Card>
          {t.hints?.length > 0 && (
            <div />
          )}
        </div>

        {/* workspace: editors + preview */}
        <div className="grid content-start gap-4">
          <Card className="!p-0 overflow-hidden">
            <div className="flex items-center gap-1 border-b border-line px-2 py-1.5">
              {['html', 'css', 'js'].filter((l) => l !== 'js' || files.js).map((l) => (
                <button key={l} onClick={() => setActiveTab(l)} className={`btn btn-ghost btn-sm font-mono uppercase ${activeTab === l ? 'text-brand' : ''}`}>{l}</button>
              ))}
              {t.solution && (
                <button className="btn btn-ghost btn-sm ml-auto" onClick={() => setShowSolution(true)} title="Show example solution">
                  <Eye size={14} /> Solution
                </button>
              )}
            </div>
            <div style={{ height: 320 }}>
              <CodeEditor value={files[activeTab]} language={activeTab} onChange={(v) => setFiles((f) => ({ ...f, [activeTab]: v }))} height="100%" />
            </div>
          </Card>
          <div style={{ height: 360 }}>
            <SandboxPreview html={files.html} css={files.css} js={files.js} />
          </div>
        </div>
      </div>

      <Modal open={showSolution} onClose={() => setShowSolution(false)} title="Example solution" wide>
        <p className="mb-3 text-xs text-muted">Compare with yours — there are many valid ways to build this.</p>
        {['html', 'css', 'js'].map((l) => (t.solution?.[l] || t.starterFiles?.[l]) && (
          <div key={l}>
            <div className="mb-1 mt-3 font-mono text-[10px] uppercase text-muted">{l}</div>
            <pre className="max-h-72 overflow-auto rounded-lg border border-line bg-surface p-3 font-mono text-xs leading-relaxed">{showSolution ? (t.solution[l] || '(starter only — that section was already correct)') : '🔒 Click reveal to view'}</pre>
          </div>
        ))}
        <p className="mt-3 text-[11px] text-muted">
          <Lock size={11} className="inline" /> Reveal counts as using help — your challenge score on graded items reflects that when applicable.
        </p>
      </Modal>
    </div>
  );
}

function CompletionChecker({ files, criteria, onSolved }) {
  const ok = FrontendGrader.check(files, criteria);
  useEffect(() => onSolved(ok));
  return null;
}
