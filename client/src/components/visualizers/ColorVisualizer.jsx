import { useMemo, useState } from 'react';
import VisualizerShell from './VisualizerShell.jsx';
import './visualizer.css';

const DEFAULT = { color: '#ff7a45', gradient: true, angle: 135, color2: '#c9a24a' };

function hexToHsl(hex) {
  const m = hex.replace('#', '');
  const r = parseInt(m.slice(0, 2), 16) / 255, g = parseInt(m.slice(2, 4), 16) / 255, b = parseInt(m.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
}

export default function ColorVisualizer({ initial = {} }) {
  const [state, setState] = useState({ ...DEFAULT, ...initial });
  const bg = state.gradient ? `linear-gradient(${state.angle}deg, ${state.color}, ${state.color2})` : state.color;

  const css = useMemo(
    () => `.target {
${state.gradient ? `  background: linear-gradient(${state.angle}deg, ${state.color}, ${state.color2});` : `  background: ${state.color};`}
}`,
    [state]
  );

  const hsl = hexToHsl(state.color);

  return (
    <VisualizerShell
      css={css}
      controls={
        <>
          <div>
            <div className="viz-label"><span>Color 1</span><span className="viz-value">{state.color} · hsl({hsl.join(', ')})</span></div>
            <input type="color" className="h-9 w-full cursor-pointer rounded-lg border border-line bg-elevated" value={state.color} onChange={(e) => setState((s) => ({ ...s, color: e.target.value }))} aria-label="First color" />
          </div>
          <label className="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" checked={state.gradient} onChange={(e) => setState((s) => ({ ...s, gradient: e.target.checked }))} />
            Use a gradient
          </label>
          {state.gradient && (
            <>
              <div>
                <div className="viz-label"><span>Color 2</span></div>
                <input type="color" className="h-9 w-full cursor-pointer rounded-lg border border-line bg-elevated" value={state.color2} onChange={(e) => setState((s) => ({ ...s, color2: e.target.value }))} aria-label="Second color" />
              </div>
              <div>
                <div className="viz-label"><span>Angle</span><span className="viz-value">{state.angle}°</span></div>
                <input type="range" min={0} max={360} value={state.angle} onChange={(e) => setState((s) => ({ ...s, angle: Number(e.target.value) }))} aria-label="Gradient angle" />
              </div>
            </>
          )}
        </>
      }
      stage={
        <div className="stage-bg grid place-items-center p-6" style={{ minHeight: 280 }}>
          <div style={{ background: bg, width: 240, height: 150, borderRadius: 12, border: '1px solid var(--border)' }} aria-label="color demo box" />
        </div>
      }
      initial={() => setState({ ...DEFAULT })}
    />
  );
}
