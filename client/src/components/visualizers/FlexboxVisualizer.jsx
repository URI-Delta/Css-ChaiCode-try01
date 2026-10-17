import { useState, useMemo } from 'react';
import VisualizerShell from './VisualizerShell.jsx';
import './visualizer.css';

const DEFAULT = {
  direction: 'row',
  justify: 'flex-start',
  align: 'stretch',
  wrap: 'nowrap',
  gap: 10,
  count: 5,
  itemSize: 0.6,
};

const OPTIONS = {
  direction: ['row', 'row-reverse', 'column', 'column-reverse'],
  justify: ['flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly'],
  align: ['stretch', 'flex-start', 'center', 'flex-end', 'baseline'],
  wrap: ['nowrap', 'wrap'],
};

function Select({ label, value, options, onChange }) {
  return (
    <div>
      <div className="viz-label">
        <span>{label}</span>
        <span className="viz-value">{value}</span>
      </div>
      <select className="select-viz" value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function FlexboxVisualizer({ initial = {} }) {
  const [state, setState] = useState({ ...DEFAULT, ...initial });
  const set = (k) => (v) => setState((s) => ({ ...s, [k]: v }));

  const colAxis = state.direction.startsWith('column');
  const itemW = colAxis ? 90 : Math.round((360 - (state.count - 1) * state.gap) / state.count);
  const itemH = colAxis ? 32 : 40;
  const isRow = !colAxis;
  const stageH = colAxis ? Math.min(260, state.count * (itemH + state.gap) + 20) : 170;
  const stageW = isRow ? Math.min(560, state.count * itemW + (state.count - 1) * state.gap + 20) : undefined;

  const style = {
    display: 'flex',
    flexDirection: state.direction,
    justifyContent: state.justify,
    alignItems: state.align,
    flexWrap: state.wrap,
    gap: state.gap,
    height: stageH,
    width: stageW,
  };
  if (state.wrap === 'wrap' && isRow) style.height = state.count > 4 ? 240 : 170;

  const itemStyle = { width: itemW, height: itemH, flex: `0 0 auto`, minWidth: itemW };
  if (state.align === 'stretch' && colAxis) itemStyle.width = 'auto';

  const css = useMemo(
    () => `container {
  display: flex;
  flex-direction: ${state.direction};
  justify-content: ${state.justify};
  align-items: ${state.align};
  flex-wrap: ${state.wrap};
  gap: ${state.gap}px;
}`,
    [state]
  );

  return (
    <VisualizerShell
      css={css}
      controls={
        <>
          <Select label="flex-direction" value={state.direction} options={OPTIONS.direction} onChange={set('direction')} />
          <Select label="justify-content" value={state.justify} options={OPTIONS.justify} onChange={set('justify')} />
          <Select label="align-items" value={state.align} options={OPTIONS.align} onChange={set('align')} />
          <Select label="flex-wrap" value={state.wrap} options={OPTIONS.wrap} onChange={set('wrap')} />
          <div>
            <div className="viz-label">
              <span>gap</span>
              <span className="viz-value">{state.gap}px</span>
            </div>
            <input type="range" min={0} max={40} value={state.gap} onChange={(e) => set('gap')(Number(e.target.value))} aria-label="Gap" />
          </div>
          <div>
            <div className="viz-label">
              <span>items</span>
              <span className="viz-value">{state.count}</span>
            </div>
            <input type="range" min={2} max={9} value={state.count} onChange={(e) => set('count')(Number(e.target.value))} aria-label="Item count" />
          </div>
        </>
      }
      stage={
        <div className="stage-bg flex items-center justify-center overflow-auto p-4" style={{ minHeight: stageH + 60 }}>
          <div
            style={{
              ...style,
              background: 'var(--elevated)',
              outline: '1px dashed var(--brand)',
              outlineOffset: 6,
              borderRadius: 8,
              padding: 8,
              flexShrink: 0,
            }}
            aria-label="flexbox demo container"
          >
            {Array.from({ length: state.count }, (_, i) => (
              <div
                key={i}
                style={{
                  ...itemStyle,
                  background: 'rgba(255,122,69,.16)',
                  border: '1px solid #ff7a45',
                  borderRadius: 6,
                  display: 'grid',
                  placeItems: 'center',
                  color: '#eee8d8',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  boxSizing: 'border-box',
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
