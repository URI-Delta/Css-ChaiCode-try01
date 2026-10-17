import { useState, useMemo } from 'react';
import VisualizerShell from './VisualizerShell.jsx';
import './visualizer.css';

const MODES = ['block', 'inline', 'inline-block', 'flex', 'grid', 'none'];
const NOTES = {
  block: 'Each child starts a new line and stretches to full width.',
  inline: 'Children flow like text — vertical margins and height are ignored.',
  'inline-block': 'Children flow like text but honor width, height and vertical margins.',
  flex: 'Children become flex items on one axis.',
  grid: 'Children snap to a strict row-and-column grid.',
  none: 'Children vanish and take no space (visibility: hidden would keep them).',
};

const DEFAULT = { display: 'block', count: 5 };

export default function DisplayVisualizer({ initial = {} }) {
  const [state, setState] = useState({ ...DEFAULT, ...initial });
  const setDisplay = (display) => setState((s) => ({ ...s, display }));

  const css = useMemo(() => `.container {
  display: ${state.display};
}

.children { 
  /* demo children: each styled the same */
  padding: 12px 16px;
  background: #21201a;
  border: 1px solid #ff7a45;
  border-radius: 6px;
}`, [state.display]);

  const child = {
    padding: '12px 16px',
    background: '#21201a',
    border: '1px solid #ff7a45',
    borderRadius: 6,
    color: '#eee8d8',
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
  };
  if (state.display === 'block') child.display = 'block';
  if (state.display === 'inline') child.display = 'inline';
  if (state.display === 'inline-block') child.display = 'inline-block';
  if (state.display === 'flex') child.display = 'block';
  if (state.display === 'grid') child.display = 'block';
  if (state.display === 'none') child.display = 'none';

  return (
    <VisualizerShell
      css={css}
      controls={
        <>
          <div>
            <div className="viz-label">
              <span>display</span>
              <span className="viz-value">{state.display}</span>
            </div>
            <select className="select-viz" value={state.display} onChange={(e) => setDisplay(e.target.value)} aria-label="Display mode">
              {MODES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <p className="mt-2 text-[11px] leading-snug text-muted">{NOTES[state.display]}</p>
          </div>
          <div>
            <div className="viz-label">
              <span>children</span>
              <span className="viz-value">{state.count}</span>
            </div>
            <input type="range" min={1} max={8} value={state.count} onChange={(e) => setState((s) => ({ ...s, count: Number(e.target.value) }))} aria-label="Number of children" />
          </div>
        </>
      }
      stage={
        <div className="stage-bg min-h-[260px] p-3">
          <div
            style={{
              display: state.display === 'flex' ? 'flex' : state.display === 'grid' ? 'grid' : 'block',
              gap: state.display === 'flex' || state.display === 'grid' ? 10 : undefined,
              gridTemplateColumns: state.display === 'grid' ? 'repeat(3, minmax(80px, 1fr))' : undefined,
              flexWrap: state.display === 'flex' ? 'wrap' : undefined,
              outline: '1px dashed var(--border)',
              outlineOffset: 8,
              borderRadius: 8,
              padding: 6,
              ...(child.display === 'inline-block' ? { display: 'block', fontSize: 0 } : {}),
            }}
            aria-label="display demo container"
          >
            {Array.from({ length: state.display === 'none' ? 0 : state.count }, (_, i) => (
              <span key={i} style={child}>
                {state.display === 'inline-block' ? `Item ${i + 1}` : `Item ${i + 1}`}
              </span>
            ))}
            {state.display === 'none' && <span className="text-[11px] text-muted" style={{ display: 'block' }}>All children hidden under display: none.</span>}
          </div>
        </div>
      }
      initial={() => setState({ ...DEFAULT })}
    />
  );
}
