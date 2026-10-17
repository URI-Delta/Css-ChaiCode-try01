import { useMemo, useState } from 'react';
import VisualizerShell from './VisualizerShell.jsx';
import './visualizer.css';

const DEFAULT = { selector: '.nav a.active' };

/** Splits a selector's final compound and scores ids/classes/tags. */
function score(selector) {
  const compounds = selector.split(/[\s>+~]+/).map((c) => c.trim()).filter(Boolean);
  let ids = 0, classes = 0, tags = 0;
  for (const sel of compounds) {
    for (const part of sel.split(',')) {
      ids += (part.match(/#[\w-]+/g) || []).length;
      classes += (part.match(/\.[\w-]+/g) || []).length + (part.match(/:[\w-]+(\([^)]*\))?/g) || []).length + (part.match(/\[[^\]]+\]/g) || []).length;
      tags += (part.replace(/[#.][\w-]+/g, '').match(/^[a-z]+/i) || [])[0] ? 1 : 0;
    }
  }
  return { ids, classes, tags, total: ids * 100 + classes * 10 + tags };
}

export default function SpecificityVisualizer({ initial = {} }) {
  const [selector, setSelector] = useState(initial?.selector || DEFAULT.selector);
  const s = useMemo(() => score(selector), [selector]);

  const css = useMemo(() => `/* specificity score: ${s.ids}-${s.classes}-${s.tags}  (total ${s.total}) */\n${selector} {\n  /* rules here */\n}`, [selector, s]);

  const clash = [
    { sel: selector, score: s.total },
    { sel: '#over', score: score('#over').total },
    { sel: '.wrap .over', score: score('.wrap .over').total },
    { sel: 'over-tag', real: 'over', score: score('over').total },
  ];

  return (
    <VisualizerShell
      css={css}
      controls={
        <>
          <div>
            <label htmlFor="spec-input" className="viz-label">
              <span>Selector</span>
            </label>
            <input id="spec-input" className="input-base font-mono text-xs" value={selector} onChange={(e) => setSelector(e.target.value)} placeholder="e.g. .nav a.active" />
          </div>
          <div className="grid gap-1 text-xs text-muted">
            <div className="flex justify-between"><span>IDs</span><span className="viz-value">{s.ids} × 100</span></div>
            <div className="flex justify-between"><span>Classes/attrs/pseudo</span><span className="viz-value">{s.classes} × 10</span></div>
            <div className="flex justify-between"><span>Elements</span><span className="viz-value">{s.tags} × 1</span></div>
            <hr className="border-line" />
            <div className="flex justify-between font-semibold text-text"><span>Total</span><span className="text-brand">{s.total}</span></div>
          </div>
        </>
      }
      stage={
        <div className="grid gap-2">
          <div className="viz-label"><span>Matchup vs common selectors</span><span /></div>
          {clash.map((c) => (
            <div key={c.sel} className="flex items-center justify-between rounded-lg border border-line bg-surface px-3 py-2">
              <code className="font-mono text-xs">{c.real || c.sel}</code>
              <span className={s.total >= c.score ? 'text-success' : 'text-error'} style={c.sel === selector ? { color: 'var(--brand)' } : undefined}>{c.score}</span>
            </div>
          ))}
          <p className="text-[11px] text-muted">Green = wins against your selector, red = loses. <code className="font-mono">!important</code> ignored on purpose — avoid it.</p>
        </div>
      }
      initial={() => setSelector(DEFAULT.selector)}
    />
  );
}
