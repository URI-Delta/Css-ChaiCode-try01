import { Card } from '../../components/common/ui.jsx';

export default function About() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold tracking-tight">About CSS Visual</h1>
      <p className="mt-3 text-muted">
        CSS Visual exists because most CSS tutorials show you code and ask you to imagine the result. Here, every concept ships with an interactive visualizer: you drag and the browser answers. Then the playground, challenges and projects put that understanding to work.
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Card>
          <div className="text-2xl" aria-hidden>🎚️</div>
          <h3 className="mt-2 font-semibold">Visualizers first</h3>
          <p className="mt-1 text-sm text-muted">Twelve of them, from the box model to stacking contexts. All live rendering.</p>
        </Card>
        <Card>
          <div className="text-2xl" aria-hidden>🧪</div>
          <h3 className="mt-2 font-semibold">Sandboxed playground</h3>
          <p className="mt-1 text-sm text-muted">Your code runs in a locked-down iframe — it can't touch the app's cookies or storage.</p>
        </Card>
        <Card>
          <div className="text-2xl" aria-hidden>🤖</div>
          <h3 className="mt-2 font-semibold">AI tutor with limits</h3>
          <p className="mt-1 text-sm text-muted">Quotas are enforced on the backend per user, per day. Fair for everyone.</p>
        </Card>
      </div>
      <h2 className="mt-10 text-lg font-semibold">The stack</h2>
      <p className="mt-2 text-sm text-muted">
        React + Vite on the front, Node/Express + MongoDB on the back, JWT sessions in secure cookies, CodeMirror editors, an optional OpenAI-compatible tutor backend, Stripe billing when configured.
      </p>
    </div>
  );
}
