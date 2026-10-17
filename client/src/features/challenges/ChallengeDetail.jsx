import { useEffect, useState, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Lightbulb, CheckCircle2, XCircle, Award } from 'lucide-react';
import CodeEditor from '../../components/editor/CodeEditor.jsx';
import SandboxPreview from '../playground/SandboxPreview.jsx';
import { Card, Badge, Skeleton, EmptyState } from '../../components/common/ui.jsx';
import Button from '../../components/common/Button.jsx';
import api, { errMessage } from '../../services/api.js';
import { useUIStore } from '../../store/uiStore.js';
import { useAuthStore } from '../../store/authStore.js';
import clsx from 'clsx';

const TYPE_LABELS = {
  'fill-code': 'Fill the code',
  debug: 'Debug CSS',
  'visual-target': 'Visual target',
  responsive: 'Responsive',
  'multiple-choice': 'Quiz',
  'fill-blank': 'Fill the blank',
};

const TYPE_EDITORS = {
  'fill-code': ['css'],
  debug: ['css'],
  'visual-target': ['css'],
  responsive: ['css'],
  'multiple-choice': [],
  'fill-blank': [],
};

export default function ChallengeDetail() {
  const { challengeSlug } = useParams();
  const user = useAuthStore((s) => s.user);
  const toast = useUIStore((s) => s.toast);
  const [state, setState] = useState({ loading: true, challenge: null, locked: false, error: null });
  const [code, setCode] = useState({ css: '', html: '', js: '' });
  const [answer, setAnswer] = useState('');
  const [attemptsResult, setAttemptsResult] = useState(null);
  const [hintsShown, setHintsShown] = useState(1);
  const [attemptsInfo, setAttemptsInfo] = useState(null);
  const [solution, setSolution] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [previewError, setPreviewError] = useState(null);
  const [facts, setFacts] = useState({});

  useEffect(() => {
    api.get(`/api/v1/challenges/${challengeSlug}`)
      .then(({ data }) => {
        setState({ loading: false, challenge: data.challenge, locked: data.locked, error: null });
        setCode({ css: data.challenge.starter?.css || '', html: data.challenge.starter?.html || '', js: '' });
        setAnswer(String(data.challenge.starter?.correctIndex ?? data.challenge.starter?.answer ?? ''));
        if (user) {
          api.get(`/api/v1/challenges/${data.challenge.id}/attempts/me`).then(({ data: a }) => setAttemptsInfo({ attempts: a.attempts?.length || 0, bestPassed: a.bestPassed, loaded: true })).catch(() => {});
        }
      })
      .catch((err) => setState({ loading: false, challenge: null, locked: false, error: errMessage(err) }));
  }, [challengeSlug, user]);

  if (state.loading) return <div className="mx-auto max-w-6xl"><Skeleton className="h-12" /><Skeleton className="mt-4 h-96" /></div>;
  if (state.error) return <EmptyState icon="⚠️" title="Challenge not found" description={state.error} />;

  const c = state.challenge;
  const editorLangs = TYPE_EDITORS[c.type] || [];
  const hasPreview = editorLangs.length > 0;

  /** Collect sandbox facts from computed style: serialized computed style for a demo element. */
  const collectFacts = () => {
    if (!hasPreview) return {};
    return {};
  };

  /** Client harness for visual feedback only; authoritative grading is server-side. */
  const submit = async () => {
    if (!user) {
      toast('Sign in to submit and track your streak', 'warn');
      return;
    }
    setSubmitting(true);
    try {
      const body = { ...collectFacts() };
      if (c.type === 'multiple-choice' || c.type === 'fill-blank') body.answer = answer;
      if (hasPreview) {
        body.css = code.css;
        body.html = code.html;
        body.js = code.js;
        body.facts = facts;
      }
      const { data } = await api.post(`/api/v1/challenges/${c.id}/attempts`, body);
      if (data.hint) {
        setAttemptsResult({ hintOnly: true, hint: data.hint });
        toast('Hint unlocked', 'info');
        return;
      }
      setAttemptsResult(data);
      setAttemptsInfo({ attempts: data.attempts, bestPassed: data.passed, loaded: true });
      if (data.solution) setSolution(data.solution);
      if (data.passed) {
        toast('Challenge passed! 🎉', 'success');
        data.newAchievements?.forEach((a) => toast(`${a.icon} ${a.title} unlocked`, 'success', 6000));
      } else {
        toast('Not there yet — check the requirements list', 'error');
      }
    } catch (err) {
      toast(errMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const requirements = attemptsResult?.results || [];

  const getHint = async () => {
    try {
      const { data } = await api.post(`/api/v1/challenges/${c.id}/attempts`, { hintIndex: Math.min(hintsShown, (c.hints || []).length - 1) });
      if (data.hint) {
        setAttemptsResult({ hintOnly: true, hint: data.hint });
        setHintsShown((n) => n + 1);
      } else {
        toast('All hints unlocked — you have what you need!', 'info');
      }
    } catch (err) {
      toast(errMessage(err), 'error');
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <Link to="/challenges" className="text-xs text-muted hover:text-text">← All challenges</Link>        <div className="mt-2 flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight">{c.title}</h1>
          <Badge>{TYPE_LABELS[c.type]}</Badge>
          <Badge tone={c.difficulty === 'advanced' ? 'error' : c.difficulty === 'intermediate' ? 'pro' : 'success'}>{c.difficulty}</Badge>
          <span className="font-mono text-xs text-muted">{c.points} pts</span>
          {attemptsInfo?.bestPassed && <Badge tone="success">passed</Badge>}
        </div>

      {editorLangs.length > 0 && (
        <div className="mt-4 flex items-center gap-3 border-b border-line pb-2 text-xs text-muted">
          <Lightbulb size={14} className="text-pro" />
          <span>Requirements auto-grade on submit. Hints are progressive — try before revealing.</span>
        </div>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="grid gap-4">
          {/* task description */}
          <Card className="prose-lesson !p-4 text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{c.instructions}</ReactMarkdown>
          </Card>

          {/* editor + preview for code challenges */}
          {editorLangs.includes('css') && (
            <Card className="!p-0 overflow-hidden">
              <div className="border-b border-line px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-muted">CSS editor</div>
              <div style={{ height: 240 }}>
                <CodeEditor value={code.css} language="css" onChange={(v) => setCode((s) => ({ ...s, css: v }))} height="100%" />
              </div>
              <div className="border-t border-line px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-muted">Live preview (sandboxed)</div>
              <div style={{ height: 220 }}>
                <SandboxPreview html={code.html} css={code.css} js={code.js} onError={setPreviewError} />
              </div>
            </Card>
          )}

          {/* answer-based UIs */}
          {c.type === 'multiple-choice' && (
            <Card>
              <p className="text-sm font-medium">{c.starter.question}</p>
              <div className="mt-3 grid gap-2">
                {c.starter.options?.map((opt, i) => (
                  <label key={i} className={clsx('flex cursor-pointer items-center gap-2 rounded-lg border p-2.5 text-sm', String(answer) === String(i) ? 'border-brand bg-brand/5' : 'border-line hover:border-muted')}>
                    <input type="radio" name="mcq" checked={String(answer) === String(i)} onChange={() => setAnswer(String(i))} />
                    {opt}
                  </label>
                ))}
              </div>
            </Card>
          )}
          {c.type === 'fill-blank' && (
            <Card>
              <p className="text-sm font-medium">{c.starter.question}</p>
              <div className="mt-3 font-mono">
                <pre className="rounded-lg border border-line bg-surface p-3 text-sm">{`box-sizing: [* You fill in: value *]`}</pre>
                <input className="input-base mt-2 w-64 font-mono" placeholder="your answer" value={answer} onChange={(e) => setAnswer(e.target.value)} aria-label="Your answer" />
              </div>
            </Card>
          )}

          {/* attempts feedback */}
          {attemptsResult?.hintOnly && (
            <Card className="!border-pro/40" tone="hint">
              <p className="text-sm text-pro">💬 {attemptsResult.hint}</p>
            </Card>
          )}
          {attemptsResult && !attemptsResult.hintOnly && (
            <Card>
              <div className="flex items-center gap-2">
                {attemptsResult.passed ? <CheckCircle2 className="text-success" size={18} /> : <XCircle className="text-error" size={18} />}
                <span className="font-semibold">{attemptsResult.passed ? 'Passed!' : `Requirements: ${requirements.filter((r) => r.passed).length}/${requirements.length}`}</span>
                <span className="ml-auto font-mono text-xs text-muted">attempt #{attemptsResult.attempts} · score {attemptsResult.score}</span>
              </div>
              <ul className="mt-3 grid gap-1.5 text-sm">
                {requirements.map((r) => (
                  <li key={r.id} className={clsx('flex items-center gap-2', r.passed ? 'text-success' : 'text-muted')}>
                    {r.passed ? <CheckCircle2 size={14} /> : <XCircle size={14} className="text-error/70" />} {r.label}
                  </li>
                ))}
              </ul>
              {solution && (
                <div className="mt-3 rounded-lg border border-pro/40 bg-pro/5 p-3">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-pro">Solution revealed (after {attemptsResult.attempts} attempts)</div>
                  <pre className="mt-1.5 overflow-x-auto font-mono text-xs">{solution}</pre>
                </div>
              )}
            </Card>
          )}

          <div className="flex gap-2">
            <Button onClick={submit} loading={submitting}>
              {hasPreview || c.type === 'multiple-choice' || c.type === 'fill-blank' ? 'Submit for grading' : 'Submit'}
            </Button>
            {(c.hints?.length || 0) > 0 && (
              <Button variant="secondary" onClick={getHint}>
                <Lightbulb size={14} /> Get hint ({Math.min(hintsShown, c.hints.length)}/{c.hints.length})
              </Button>
            )}
          </div>
        </div>

        {/* side panel */}
        <div className="grid content-start gap-4">
          <Card>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Your attempts</h2>
            {attemptsInfo?.loaded ? (
              <p className="mt-2 text-sm">
                {attemptsInfo.attempts} attempt{attemptsInfo.attempts === 1 ? '' : 's'} · {attemptsInfo.bestPassed ? 'passed ✓' : 'not yet passed'}
              </p>
            ) : user ? (
              <p className="mt-2 text-sm text-muted">No attempts yet.</p>
            ) : (
              <p className="mt-2 text-sm text-muted">Sign in to track attempts.</p>
            )}
            {solution ? (
              <p className="mt-3 flex items-center gap-1.5 text-xs text-pro">
                <Award size={13} /> Solution unlocked below
              </p>
            ) : (
              <p className="mt-3 text-xs text-muted">Solutions unlock after 3 attempts.</p>
            )}
          </Card>
          {previewError && <Card className="!border-error/40 text-xs text-error">Preview error: {previewError}</Card>}
        </div>
      </div>
    </div>
  );
}
