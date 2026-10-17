import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Code2, Eye, Trophy, Sparkles, Boxes, Users, CheckCircle2 } from 'lucide-react';
import api from '../../services/api.js';
import { Card, Badge, Skeleton } from '../../components/common/ui.jsx';
import './landing.css';

const DEMO_PRESETS = {
  'justify-content: center': { justify: 'center' },
  'justify-content: space-between': { justify: 'space-between' },
  'justify-content: space-around': { justify: 'space-around' },
  'flex-start (default)': { justify: 'flex-start' },
};

const FEATURES = [
  { icon: Eye, title: 'See it change', text: 'Every visualizer is a real rendering — drag a slider and the browser redraws instantly. No screenshots, no faking.' },
  { icon: Code2, title: 'Playground with Monaco-grade editor', text: 'Write HTML, CSS and JS in a sandboxed preview. Save your experiments, share read-only links, debug others’ code.' },
  { icon: Trophy, title: 'Graded challenges', text: 'Fill-the-code, debug tasks and visual targets with automatic scoring on the server — you always know exactly which requirement is missing.' },
  { icon: Boxes, title: 'Guided projects', text: 'Fourteen starter projects from profile card to SaaS dashboard shell. Fork any starter into your own workspace and build on it.' },
];

const ROADMAP = [
  { week: 'Week 1', title: 'CSS Foundations', text: 'Selectors, colors, units and the box model.' },
  { week: 'Week 2', title: 'Layout', text: 'Display, Flexbox, Grid and Position.' },
  { week: 'Week 3', title: 'Responsive CSS', text: 'Media queries, clamp() and fluid sizing.' },
  { week: 'Week 4', title: 'Animations & Advanced', text: 'Keyframes, custom properties, stacking and architecture.' },
];

const PROJECT_TILES = ['Profile Card', 'Button Collection', 'Responsive Navbar', 'Pricing Card', 'Login Form', 'SaaS Dashboard'];

export default function Landing() {
  const [tracks, setTracks] = useState(null);
  const [preset, setPreset] = useState('justify-content: center');

  useEffect(() => {
    api.get('/api/v1/tracks').then(({ data }) => setTracks(data.tracks)).catch(() => setTracks([]));
  }, []);

  const demo = DEMO_PRESETS[preset];

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
          <div>
            <Badge tone="brand">Learn CSS by seeing it</Badge>
            <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-6xl">
              CSS you can <span className="text-brand">see.</span>
            </h1>
            <p className="mt-4 max-w-md text-muted">
              Stop memorizing. Every concept is an interactive experiment — drag a slider, watch the layout snap, read the generated code. It sticks.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/register" className="btn btn-primary">
                Start Learning CSS <ArrowRight size={16} />
              </Link>
              <Link to="/playground" className="btn btn-secondary">
                Explore the Playground
              </Link>
            </div>
            <div className="mt-7 flex flex-wrap gap-6 text-xs text-muted">
              <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-success" /> Free plan, no card</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-success" /> 6 tracks · 15 lessons</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-success" /> 12 visualizers</span>
            </div>
          </div>

          {/* live flexbox demo card */}
          <Card className="p-0 shadow-xl">
            <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-error/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-pro/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
              </div>
              <span className="select-none font-mono text-[10px] text-muted">live demo — flexbox</span>
            </div>
            <div className="p-4">
              <div className="mb-3 flex flex-wrap gap-1.5">
                {Object.keys(DEMO_PRESETS).map((k) => (
                  <button key={k} onClick={() => setPreset(k)} className={`btn btn-sm ${k === preset ? 'btn-primary' : 'btn-ghost'}`}>
                    {k}
                  </button>
                ))}
              </div>
              <div className="rounded-lg border border-brand/25 bg-surface p-2" style={{ minHeight: 68 }}>
                <div className="demo-stage" style={{ display: 'flex', justifyContent: demo.justify, gap: 10 }}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <motion.span
                      layout
                      key={`${i}-${preset}`}
                      initial={{ scale: 0.85, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                      className="demo-chip"
                    >
                      {i + 1}
                    </motion.span>
                  ))}
                </div>
              </div>
              <pre className="mt-3 overflow-x-auto rounded-lg bg-[var(--elevated)] p-3 font-mono text-[11px] leading-relaxed">
{`.row {
  display: flex;
  justify-content: ${demo.justify};
  gap: 10px;
}`}
              </pre>
              <p className="mt-2 text-center text-[11px] text-muted">…now imagine every concept working like this. That's the course.</p>
            </div>
          </Card>
        </div>
      </section>

      {/* TRACKS */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <SectionHead kicker="Learning tracks" title="A path that builds on itself" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tracks == null && Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
          {tracks?.map((t) => (
            <motion.div key={t.id} whileHover={{ y: -3 }} transition={{ duration: 0.12 }}>
              <Link to={`/learn/${t.slug}`} className="block h-full">
                <Card className="group h-full transition-colors hover:border-brand/50">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl" aria-hidden>{t.emoji}</span>
                    {t.accessLevel === 'pro' && <Badge tone="pro">Pro</Badge>}
                  </div>
                  <h3 className="mt-3 font-semibold group-hover:text-brand">{t.title}</h3>
                  <p className="mt-1.5 text-sm text-muted">{t.description}</p>
                  <div className="mt-3 flex items-center gap-2 text-[11px] text-muted">
                    <span>{t.lessonsCount || 0} lessons</span>·<span>~{t.estimatedMinutes || 60} min</span>
                    <ArrowRight size={13} className="ml-auto opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-14">
          <SectionHead kicker="Why CSS Visual" title="Visual learning, real engineering" />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <Card key={f.title}>
                <f.icon size={22} className="text-brand" aria-hidden />
                <h3 className="mt-3 text-sm font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted">{f.text}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ROADMAP */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <SectionHead kicker="Your roadmap" title="About one month to confident CSS" />
        <ol className="mt-8 grid gap-4 md:grid-cols-4">
          {ROADMAP.map((r, i) => (
            <li key={r.week} className="relative card-surface p-4" style={{ borderTop: `2px solid var(--brand)` }}>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-brand">{r.week}</div>
              <div className="mt-1 font-semibold">{r.title}</div>
              <p className="mt-1.5 text-xs text-muted">{r.text}</p>
              {i < ROADMAP.length - 1 && <ArrowRight className="absolute -right-2.5 top-1/2 hidden -translate-y-1/2 text-brand md:block" size={18} aria-hidden />}
            </li>
          ))}
        </ol>
      </section>

      {/* AI TUTOR */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-14 md:grid-cols-2">
          <div>
            <SectionHead kicker="AI tutor" title="Stuck? Ask immediately" />
            <p className="mt-2 max-w-md text-sm text-muted">
              A CSS-specific tutor is a click away on every lesson. Paste broken CSS and get a diagnosis, generate an example, or ask for a hint — without leaving the page.
            </p>
            <ul className="mt-4 grid gap-2 text-sm text-muted">
              <li className="flex items-center gap-2"><Sparkles size={15} className="text-pro" /> Explains any property in plain words</li>
              <li className="flex items-center gap-2"><Sparkles size={15} className="text-pro" /> Reviews your pasted code against the lesson goal</li>
              <li className="flex items-center gap-2"><Sparkles size={15} className="text-pro" /> Progressive hints — never dumps the answer</li>
            </ul>
            <Link to="/learn" className="btn btn-secondary mt-6">Try a lesson <ArrowRight size={15} /></Link>
          </div>
          <Card className="p-0 shadow-xl">
            <div className="border-b border-line px-4 py-2.5 font-mono text-[10px] text-muted">chat with your CSS tutor</div>
            <div className="space-y-3 p-4 text-sm">
              <ChatRow who="you">Why does my flex row ignore margin-bottom on the children?</ChatRow>
              <ChatRow>It doesn't — Flexbox treats each item as a flex item, so margins collapse differently than in normal flow. On <code className="font-mono text-brand">row</code> direction, cross-axis spacing comes from <code className="font-mono text-brand">align-items</code> or <code className="font-mono text-brand">gap</code>, not outer margins. Try <code className="font-mono text-brand">gap: 12px;</code> on the container.</ChatRow>
            </div>
          </Card>
        </div>
      </section>

      {/* PROJECTS */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <SectionHead kicker="Practice" title="Build things that look real" />
        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3">
          {PROJECT_TILES.map((t) => (
            <Link key={t} to="/projects" className="card-surface flex items-center gap-3 p-4 text-sm transition-colors hover:border-brand/60">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-elevated font-mono text-xs text-brand">▣</span>
              {t}
            </Link>
          ))}
        </div>
        <div className="mt-4 text-center">
          <Link to="/projects" className="btn btn-ghost text-brand">See all 14 guided projects →</Link>
        </div>
      </section>

      {/* PRICING */}
      <section className="mx-auto max-w-7xl px-4 pb-16">
        <SectionHead kicker="Pricing" title="Free to learn. Pro to go deep." />
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:mx-auto lg:max-w-3xl">
          <Card>
            <h3 className="text-lg font-semibold">Free</h3>
            <div className="mt-1 text-3xl font-bold">$0<span className="text-sm font-normal text-muted">/mo</span></div>
            <ul className="mt-4 grid gap-2 text-sm text-muted">
              <PlanItem>Core lessons & visualizers</PlanItem>
              <PlanItem>Playground with saving</PlanItem>
              <PlanItem>Daily challenges</PlanItem>
              <PlanItem>Limited AI tutor requests</PlanItem>
            </ul>
            <Link to="/register" className="btn btn-secondary mt-5 w-full">Get started</Link>
          </Card>
          <Card className="border-pro/50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Pro</h3>
              <Badge tone="pro">Best value</Badge>
            </div>
            <div className="mt-1 text-3xl font-bold text-pro">$9<span className="text-sm font-normal text-muted">/mo</span></div>
            <ul className="mt-4 grid gap-2 text-sm text-muted">
              <PlanItem>Everything in Free</PlanItem>
              <PlanItem>All Advanced & Architecture content</PlanItem>
              <PlanItem>Pro-only challenges & projects</PlanItem>
              <PlanItem>High daily AI tutor quota</PlanItem>
            </ul>
            <Link to="/pricing" className="btn btn-pro mt-5 w-full">See plan details</Link>
            <p className="mt-2 text-center text-[10px] text-muted">Final price is configured by the platform owner.</p>
          </Card>
        </div>
      </section>
    </div>
  );
}

function SectionHead({ kicker, title }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-widest text-brand">{kicker}</div>
      <h2 className="mt-1.5 text-2xl font-bold tracking-tight md:text-3xl">{title}</h2>
    </div>
  );
}

function PlanItem({ children }) {
  return (
    <li className="flex items-center gap-2">
      <CheckCircle2 size={15} className="shrink-0 text-success" /> {children}
    </li>
  );
}

function ChatRow({ who, children }) {
  const isYou = who === 'you';
  return (
    <div className={`flex gap-2 ${isYou ? 'justify-end' : ''}`}>
      {isYou ? (
        <div className="rounded-xl rounded-br-sm bg-brand/15 px-3.5 py-2 text-[13px]">{children}</div>
      ) : (
        <>
          <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md bg-elevated text-[11px] text-brand">✨</span>
          <div className="rounded-xl rounded-bl-sm bg-elevated px-3.5 py-2 text-[13px] leading-relaxed">{children}</div>
        </>
      )}
    </div>
  );
}
