import { useState, useMemo } from 'react';
import VisualizerShell from './VisualizerShell.jsx';
import './visualizer.css';

const DEFAULT = { columns: 3, rows: 2, gap: 14, align: 'stretch', justify: 'stretch', span: 0 };

function Select({ label, value, options, onChange }) {
  return (
    <div>
      <div className="viz-label">
        <span>{label}</span>
        <span className="viz-value">{value}</span>
      </div>
      <select className="select-viz" value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

export default function GridVisualizer({ initial = {} }) {
  const [state, setState] = useState({ ...DEFAULT, ...initial });
  const set = (k) => (v) => setState((s) => ({ ...s, [k]: v }));

  const count = state.columns * state.rows;
  const spans2 = state.span > 0 && state.span < count;
  const items = Array.from({ length: count }, (_, i) => i);
  const style = {
    display: 'grid',
    gridTemplateColumns: `repeat(${state.columns}, 1fr)`,
    gridTemplateRows: `repeat(${state.rows}, ${state.align === 'stretch' ? '1fr' : 'auto'})`,
    gap: state.gap,
    width: 480,
    maxWidth: '100%',
    height: state.align === 'stretch' ? 100 * Math.min(state.rows, 3) : undefined,
    justifyItems: state.justify === 'stretch' ? 'stretch' : state.justify,
    alignItems: state.align,
  };

  const spanIndex = 1; // item #2 spans if enabled
  const css = useMemo(
    () => `.grid-container {
  display: grid;
  grid-template-columns: repeat(${state.columns}, 1fr);
  ${state.align !== 'stretch' ? `align-items: ${state.align};` : ''}
  ${state.justify !== 'stretch' ? `justify-items: ${state.justify};` : ''}
  gap: ${state.gap}px;
}
${spans2 ? `
.item:nth-child(${spanIndex + 1}) {
  grid-column: span 2;
}` : ''}`,
    [state, spans2]
  );

  return (
    <VisualizerShell
      css={css}
      controls={
        <>
          <div>
            <div className="viz-label">
              <span>columns</span>
              <span className="viz-value">{state.columns}</span>
            </div>
            <input type="range" min={1} max={6} value={state.columns} onChange={(e) => set('columns')(Number(e.target.value))} aria-label="Columns" />
          </div>
          <div>
            <div className="viz-label">
              <span>rows</span>
              <span className="viz-value">{state.rows}</span>
            </div>
            <input type="range" min={1} max={5} value={state.rows} onChange={(e) => set('rows')(Number(e.target.value))} aria-label="Rows" />
          </div>
          <div>
            <div className="viz-label">
              <span>gap</span>
              <span className="viz-value">{state.gap}px</span>
            </div>
            <input type="range" min={0} max={40} value={state.gap} onChange={(e) => set('gap')(Number(e.target.value))} aria-label="Gap" />
          </div>
          <Select label="align-items" value={state.align} options={['stretch', 'start', 'center', 'end']} onChange={set('align')} />
          <Select label="justify-items" value={state.justify} options={['stretch', 'start', 'center', 'end']} onChange={set('justify')} />
          <label className="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" checked={spans2} onChange={(e) => set('span')(e.target.checked ? 2 : 0)} />
            Let item 2 span 2 columns
          </label>
        </>
      }
      stage={
        <div className="stage-bg flex items-center justify-center overflow-auto p-6" style={{ minHeight: 340 }}>
          <div style={{ ...style, background: 'var(--elevated)', outline: '1px dashed var(--brand)', outlineOffset: 6, borderRadius: 8, padding: 10, boxSizing: 'border-box' }} aria-label="grid demo container">
            {items.map((i) => (
              <div
                key={i}
                style={{
                  background: 'rgba(255,122,69,.16)',
                  border: '1px solid #ff7a45',
                  borderRadius: 6,
                  display: 'grid',
                  placeItems: 'center',
                  color: '#eee8d8',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  minHeight: 44,
                  gridColumn: spans2 && i === spanIndex ? 'span 2' : undefined,
                }}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>
      }
      initial={() => setState({ ...DEFAULT })}
    />
  );
}
