import { useState, useMemo, useRef } from 'react';
import VisualizerShell from './VisualizerShell.jsx';
import './visualizer.css';

const MODES = [
  { value: 'static', note: 'Default. The element sits in normal flow; top/left do nothing.' },
  { value: 'relative', note: 'Keeps its flow space but can be nudged by top/left/right/bottom. Also acts as anchor for absolute children.' },
  { value: 'absolute', note: 'Pulled out of flow and positioned against the nearest positioned ancestor (this stage).' },
  { value: 'fixed', note: 'Glued to the browser viewport — it stays put while everything scrolls. (Demo: it pins inside this stage for illustration.)' },
  { value: 'sticky', note: 'Behaves relative until it hits the top threshold, then sticks while scrolling.' },
];

const DEFAULT = { position: 'relative', top: 20, left: 20, z: 1 };

export default function PositionVisualizer({ initial = {} }) {
  const [state, setState] = useState({ ...DEFAULT, ...initial, ...initial.config });
  const stageRef = useRef(null);
  const note = MODES.find((m) => m.value === state.position)?.note;

  const offsetStyle =
    state.position === 'static' ? {} : { top: state.top, left: state.left };

  const css = useMemo(
    () => `.demo-box {
  position: ${state.position};
${state.position !== 'static' ? `  top: ${state.top}px;\n  left: ${state.left}px;` : ''}
}`,
    [state]
  );

  const box = (
    <div
      style={{
        width: 90,
        height: 56,
        borderRadius: 8,
        display: 'grid',
        placeItems: 'center',
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        color: '#0d0e09',
        fontWeight: 700,
        position: state.position === 'static' ? 'static' : state.position === 'fixed' ? 'sticky' : state.position,
        top: state.position === 'static' ? undefined : state.top === 'auto' ? undefined : (state.position === 'fixed' ? 20 : state.top),
        left: state.position === 'static' ? undefined : (state.position === 'fixed' ? 20 : state.left),
        ...offsetStyle,
        background: '#ff7a45',
        zIndex: state.z,
      }}
      aria-label="position demo element"
    >
      {state.position}
    </div>
  );

  return (
    <VisualizerShell
      css={css}
      controls={
        <>
          <div>
            <div className="viz-label">
              <span>position</span>
              <span className="viz-value">{state.position}</span>
            </div>
            <select className="select-viz" value={state.position} onChange={(e) => setState((s) => ({ ...s, position: e.target.value }))} aria-label="Position mode">
              {MODES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.value}
                </option>
              ))}
            </select>
            <p className="mt-2 text-[11px] leading-snug text-muted">{note}</p>
          </div>
          <div>
            <div className="viz-label">
              <span>top</span>
              <span className="viz-value">{state.top}px</span>
            </div>
            <input type="range" min={-40} max={140} value={state.top} onChange={(e) => setState((s) => ({ ...s, top: Number(e.target.value) }))} aria-label="Top offset" disabled={state.position === 'static'} />
          </div>
          <div>
            <div className="viz-label">
              <span>left</span>
              <span className="viz-value">{state.left}px</span>
            </div>
            <input type="range" min={-40} max={140} value={state.left} onChange={(e) => setState((s) => ({ ...s, left: Number(e.target.value) }))} aria-label="Left offset" disabled={state.position === 'static'} />
          </div>
        </>
      }
      stage={
        <div className="stage-bg p-3" style={{ minHeight: 360, maxHeight: 400 }}>
          {/* control-flow siblings */}
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 8, minHeight: 600 }}>
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} style={{ background: 'var(--elevated)', border: '1px solid var(--border)', borderRadius: 8, padding: 10, fontSize: 11, color: 'var(--muted)', width: 140 }}>
                flow item {i + 1}
              </div>
            ))}
            {state.position !== 'absolute' && <div className="relative" style={{ position: 'absolute', top: 8, right: 10 }}>{box}</div>}
            {state.position === 'absolute' && <div style={{ position: 'absolute' }}>{box}</div>}
          </div>
        </div>
      }
      footer={<p className="text-[11px] text-muted">The stage scrolls on purpose — try sticky/fixed behavior while scrolling.</p>}
      initial={() => setState({ ...DEFAULT })}
    />
  );
}
