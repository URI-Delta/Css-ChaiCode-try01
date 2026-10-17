import { useMemo, useState } from 'react';
import VisualizerShell from './VisualizerShell.jsx';
import './visualizer.css';

function Slider({ label, value, min, max, suffix = 'px', onChange }) {
  return (
    <div>
      <div className="viz-label">
        <span>{label}</span>
        <span className="viz-value">
          {value}
          {suffix}
        </span>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} aria-label={label} />
    </div>
  );
}

const DEFAULT = { margin: 16, borderWidth: 2, padding: 12, contentWidth: 140, contentHeight: 80 };
/** unit: 'px' */
export default function BoxModelVisualizer({ initial = {} }) {
  const [state, setState] = useState({ ...DEFAULT, ...initial });
  const set = (k) => (v) => setState((s) => ({ ...s, [k]: v }));

  const totalW = state.contentWidth + state.padding * 2 + state.borderWidth * 2;
  const totalH = state.contentHeight + state.padding * 2 + state.borderWidth * 2;

  const css = useMemo(
    () => `.box {
  width: ${state.contentWidth}px;
  height: ${state.contentHeight}px;
  padding: ${state.padding}px;
  border: ${state.borderWidth}px solid #ff7a45;
  margin: ${state.margin}px;
}`,
    [state]
  );

  return (
    <VisualizerShell
      css={css}
      controls={
        <>
          <Slider label="Content width" value={state.contentWidth} min={40} max={260} onChange={set('contentWidth')} />
          <Slider label="Content height" value={state.contentHeight} min={30} max={160} onChange={set('contentHeight')} />
          <Slider label="Padding" value={state.padding} min={0} max={40} onChange={set('padding')} />
          <Slider label="Border width" value={state.borderWidth} min={0} max={16} onChange={set('borderWidth')} />
          <Slider label="Margin" value={state.margin} min={0} max={60} onChange={set('margin')} />
        </>
      }
      stage={
        <div className="stage-bg flex min-h-[320px] items-center justify-center">
          <div
            aria-label="box model demo"
            style={{
              width: totalW,
              height: totalH,
              margin: state.margin,
              border: `${state.borderWidth}px solid #ff7a45`,
              padding: state.padding,
              background: 'var(--elevated)',
              borderRadius: 8,
              display: 'grid',
              placeItems: 'center',
              color: 'var(--muted)',
              fontSize: 11,
              textAlign: 'center',
              boxSizing: 'content-box',
            }}
          >
            <div style={{ width: state.contentWidth, height: state.contentHeight, background: 'rgba(255,122,69,.14)', borderRadius: 4, display: 'grid', placeItems: 'center' }}>
              content {state.contentWidth}×{state.contentHeight}
            </div>
          </div>
        </div>
      }
      footer={<p className="text-[11px] text-muted">Total box size: {totalW}×{totalH}px (padding + border included)</p>}
      initial={() => setState({ ...DEFAULT })}
    />
  );
}
