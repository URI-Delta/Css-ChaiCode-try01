import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft, ArrowRight, Bookmark, BookmarkCheck, Lock, CircleHelp } from 'lucide-react';
import api, { errMessage } from '../../services/api.js';
import { Card, Badge, Skeleton, EmptyState } from '../../components/common/ui.jsx';
import Button from '../../components/common/Button.jsx';
import CopyButton from '../../components/common/CopyButton.jsx';
import { useAuthStore } from '../../store/authStore.js';

function CodeBlock({ children }) {
  const text = String(children).replace(/\n$/, '');
  return (
    <div className="relative">
      <pre>{children}</pre>
      <div className="absolute right-2 top-2">
        <CopyButton text={text} small />
      </div>
    </div>
  );
}

export default function Lesson() {
  const { lessonSlug } = useParams();
  const [state, setState] = useState({ loading: true, data: null, error: null });
  const [bookmarkPaper, setBookmark] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [answers, setAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);

  useEffect(() => {
    api.get(`/api/v1/lessons/${lessonSlug}`)
      .then(({ data }) => setState({ loading: false, data, error: null }))
      .catch((err) => setState({ loading: false, data: null, error: errMessage(err) }));
  }, [lessonSlug]);

  // register visit once the lesson id is known (touch lastVisitedAt for streaks)
  const lessonId = state.data?.lesson?.id;
  useEffect(() => {
    if (!lessonId) return;
    api.put(`/api/v1/lessons/${lessonId}/progress`, {}).catch(() => {});
  }, [lessonId, lessonSlug]);

  if (state.loading) {
    return (
      <div className="mx-auto max-w-4xl">
        <Skeleton className="h-10" />
        <Skeleton className="mt-4 h-96" />
      </div>
    );
  }
  if (state.error) return <EmptyState icon="⚠️" title="Lesson not found" description={state.error} />;

  const { lesson, track, prev, next } = state.data;
  const gated = lesson.accessLevel === 'pro';

  const { user } = useAuthStore();
  return gated && user?.plan !== 'pro' ? (
    <div className="mx-auto max-w-4xl py-10">
      <EmptyState
        icon="🔒"
        title="This lesson is part of Pro"
        description="Advanced CSS and Architecture tracks are Pro-only on this platform."
        action={
          <Link to="/pricing" className="btn btn-pro btn-sm">See Pro plans</Link>
        }
      />
    </div>
  ) : (
    <div className="mx-auto max-w-4xl">
      <Link to={`/learn/${track?.slug}`} className="text-xs text-muted hover:text-text">
        ← {track?.title}
      </Link>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-bold tracking-tight">{lesson.title}</h1>
        <Badge>{lesson.difficulty}</Badge>
        {gated && <Badge tone="pro">Pro</Badge>}
        <span className="text-xs text-muted">~{lesson.estimatedMinutes} min</span>
        <BookmarkButton lesson={lesson} />
      </div>

      {lesson.objectives?.length > 0 && (
        <Card className="mt-4 !p-4">
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">Learning objectives</div>
          <ul className="text-sm text-muted">
            {lesson.objectives.map((o, i) => (
              <li key={i} className="mt-1">
                <span className="mr-1.5 text-brand">▸</span>
                {o}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <article className="prose-lesson mt-6">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
          }}
        >
          {lesson.content}
        </ReactMarkdown>
      </article>

      {lesson.codeExamples?.length > 0 && (
        <Card className="mt-6 !p-4">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">Examples</div>
          {lesson.codeExamples.map((ex, i) => (
            <div key={i} className="mt-3 first:mt-0">
              <div className="mb-1 flex items-center gap-2">
                <span className="rounded bg-elevated px-2 py-0.5 font-mono text-[10px] uppercase text-muted">{ex.language}</span>
                <span className="text-xs font-semibold">{ex.label}</span>
              </div>
              <pre className="overflow-x-auto rounded-lg border border-line bg-surface p-3 font-mono text-[12px] leading-relaxed">{ex.code}</pre>
              {ex.note && <p className="mt-1 text-[11px] text-muted">{ex.note}</p>}
            </div>
          ))}
        </Card>
      )}

      {/* Visualizer */}
      <section className="mt-8">
        <VisualizerSlot lesson={lesson} />
      </section>

      {/* Quiz */}
      {lesson.quiz?.length > 0 && (
        <Card className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted">
              <CircleHelp size={15} /> Practice questions
            </h2>
            {!showQuiz && (
              <Button size="sm" onClick={() => setShowQuiz(true)}>
                Start quiz
              </Button>
            )}
          </div>
          {showQuiz && <QuizView lesson={lesson} answers={answers} setAnswers={setAnswers} result={quizResult} setResult={setQuizResult} lessonId={lesson.id} />}
        </Card>
      )}

      {/* mark complete + nav */}
      <div className="mt-8 flex items-center justify-between gap-3 border-t border-line pt-5">
        {prev ? (
          <Link to={`/lesson/${prev.slug}`} className="btn btn-secondary btn-sm">
            <ArrowLeft size={14} /> {prev.title}
          </Link>
        ) : <span />}
        {next ? (
          <Link to={`/lesson/${next.slug}`} className="btn btn-primary btn-sm">
            {next.title} <ArrowRight size={14} />
          </Link>
        ) : (
          <Link to="/dashboard" className="btn btn-primary btn-sm">Back to dashboard</Link>
        )}
      </div>
    </div>
  );
}

function BookmarkButton({ lesson }) {
  const [saved, setSaved] = useState(false);
  const toggle = async () => {
    if (saved) {
      await api.delete('/api/v1/me/bookmarks', { data: { resourceType: 'lesson', resourceId: lesson.slug } }).catch(() => {});
      setSaved(false);
    } else {
      await api.post('/api/v1/me/bookmarks', { resourceType: 'lesson', resourceId: lesson.slug, meta: { title: lesson.title } }).catch(() => {});
      setSaved(true);
    }
  };
  return (
    <button className="btn btn-ghost btn-sm ml-auto" onClick={toggle} title={saved ? 'Remove bookmark' : 'Bookmark this lesson'}>
      {saved ? <BookmarkCheck size={15} className="text-brand" /> : <Bookmark size={15} />}
    </button>
  );
}

function VisualizerSlot({ lesson }) {
  const [Visualizer, setVisualizer] = useState(null);
  useEffect(() => {
    import('../../components/visualizers/index.jsx').then((m) => {
      const C = m.visualizers?.[lesson.visualizer];
      setVisualizer(() => (C ? () => <C initial={lesson.visualizerConfig || {}} /> : null));
    });
  }, [lesson.visualizer]);

  if (!lesson.visualizer) return null;
  return (
    <div>
      <h2 className="mb-3 text-lg font-semibold">
        Try it live <span className="text-muted font-normal text-xs">— every change updates the preview</span>
      </h2>
      {Visualizer ? (
        Visualizer
      ) : (
        <Card className="text-sm text-muted">No visualizer available for this lesson.</Card>
      )}
    </div>
  );
}

function QuizView({ lesson, answers, setAnswers, result, setResult, lessonId }) {
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    setLoading(true);
    try {
      const selected = lesson.quiz.map((_, i) => (answers[i] ?? -1));
      const { data } = await api.post(`/api/v1/lessons/${lessonId}/quiz`, { answers: selected });
      setResult(data);
    } catch (err) {
      setResult({ error: errMessage(err) });
    } finally {
      setLoading(false);
    }
  };
  const allAnswered = lesson.quiz.every((_, i) => answers[i] != null);
  return (
    <div className="mt-4 grid gap-4">
      {lesson.quiz.map((q, i) => (
        <QuestionView key={i} index={i} question={q} answers={answers} setAnswers={setAnswers} result={result} />
      ))}
      {!result && (
        <Button onClick={submit} loading={loading} disabled={!allAnswered}>
          Submit answers
        </Button>
      )}
      {result && !result.error && (
        <div className="rounded-lg border border-line bg-surface p-3 text-sm">
          <span className={result.score >= 100 ? 'text-success' : 'text-pro'}>Score: {result.score}%</span>
          {(result.results || []).map((r, i) =>
            !r.correct && <p key={i} className="mt-1 text-muted">{lesson.quiz[i]?.explanation || 'Review this question.'}</p>
          )}
        </div>
      )}
      {result?.error && <p className="text-sm text-error">{result.error}</p>}
    </div>
  );
}

function QuestionView({ index, question, answers, setAnswers, result }) {
  return (
    <div>
      <p className="text-sm font-medium">{index + 1}. {question.question}</p>
      <div className="mt-2 grid gap-1.5">
        {question.options.map((opt, oi) => {
          const chosen = answers[index] === oi;
          const revealed = result?.results?.[index];
          return (
            <label key={oi} className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2.5 text-sm transition-colors ${chosen ? 'border-brand bg-brand/5' : 'border-line hover:border-muted'}`}>
              <input type="radio" name={`q-${index}`} checked={chosen} onChange={() => setAnswers((a) => ({ ...a, [index]: oi }))} />
              {opt}
              {revealed && revealed.correct && chosen && <span className="ml-auto text-success">✓</span>}
              {revealed && !revealed.correct && chosen && <span className="ml-auto text-error">✗</span>}
            </label>
          );
        })}
      </div>
    </div>
  );
}
