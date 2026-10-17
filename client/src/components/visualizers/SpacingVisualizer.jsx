import { useState, useMemo } from 'react';
import VisualizerShell from './VisualizerShell.jsx';
import './visualizer.css';

const DEFAULT = { margin: 16, padding: 12, width: 160, sizing: 'content-box' };

export default function SpacingVisualizer({ initial = {} }) {
  const [state, setState] = useState({ ...DEFAULT, ...initial });
  const set = (k) => (v) => setState((s) => ({ ...s, [k]: v }));
  const border = 2;
  const totalOuter = state.width * (state.sizing === 'border-box' ? 1 : 1) + (state.sizing === 'content-box' ? state.padding * 2 + border * 2 : 0);

  const css = useMemo(
    () => `box {
  box-sizing: ${state.sizing};
  width: ${state.width}px;
  padding: ${state.padding}px;
  margin: ${state.margin}px;
  border: ${border}px solid;
}
/* rendered width incl. everything: ${totalOuter}px */`,
    [state, totalOuter]
  );

  return (
    <VisualizerShell
      css={css}
      controls={
        <>
          <div>
            <div className="viz-label"><span>box-sizing</span></div>
            <select className="select-viz" value={state.sizing} onChange={(e) => set('sizing')(e.target.value)} aria-label="Sizing mode">
              <option>content-box</option>
              <option>border-box</option>
            </select>
          </div>
          {[
            ['width', 'Width', 80, 260],
            ['padding', 'Padding', 0, 40],
            ['margin', 'Margin', 0, 48],
          ].map(([key, label, min, max]) => (
            <div key={key}>
              <div className="viz-label">
                <span>{label}</span>
                <span className="viz-value">{state[key]}px</span>
              </div>
              <input type="range" min={min} max={max} value={state[key]} onChange={(e) => set(key)(Number(e.target.value))} aria-label={label} />
            </div>
          ))}
        </>
      }
      stage={
        <div className="stage-bg grid place-items-center p-8" style={{ minHeight: 300 }}>
          <div style={{ background: 'repeating-linear-gradient(45deg, var(--elevated), var(--elevated) 9px, var(--surface) 9px, var(--surface) 18px)', borderRadius: 10, padding: state.margin }}>
            <div
              style={{
                boxSizing: state.sizing,
                width: state.width,
                padding: state.padding,
                border: `${border}px solid #ff7a45`,
                background: 'var(--card)',
                borderRadius: 8,
                display: 'grid',
                placeItems: 'center',
                color: 'var(--muted)',
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
                textAlign: 'center',
              }}
            >
              {state.width}px
              <br />
              <span className="text-[10px]">{state.sizing === 'border-box' ? 'width includes padding+border' : `real outer: ${state.width + state.padding * 2 + border * 2}px`}</span>
            </div>
          </div>
        </div>
      }
      initial={() => setState({ ...DEFAULT })}
    />
  );
}
