import { useState, useMemo } from 'react';
import VisualizerShell from './VisualizerShell.jsx';
import './visualizer.css';

const FAMILIES = ["'JetBrains Mono', monospace", "Inter, system-ui, sans-serif", "Georgia, serif", "'Courier New', monospace"];
const DEFAULT = { family: 1, size: 1.6, lineHeight: 1.6, weight: 500, spacing: 0 };

export default function TypographyVisualizer({ initial = {} }) {
  const [state, setState] = useState({ ...DEFAULT, ...initial });
  const set = (k) => (v) => setState((s) => ({ ...s, [k]: v }));

  const css = useMemo(
    () => `.sample {
  font-family: ${FAMILIES[state.family]};
  font-size: ${state.size}rem;
  line-height: ${state.lineHeight};
  font-weight: ${state.weight};
  letter-spacing: ${state.spacing}em;
}`,
    [state]
  );

  const sampleText = 'The quick orange fox jumps over the lazy dog 0123456789 {} ;';

  return (
    <VisualizerShell
      css={css}
      controls={
        <>
          <div>
            <div className="viz-label"><span>Family</span><span className="viz-value">{FAMILIES[state.family].split(',')[0].replace(/'/g, '')}</span></div>
            <select className="select-viz" value={state.family} onChange={(e) => set('family')(Number(e.target.value))} aria-label="Font family">
              {FAMILIES.map((f, i) => (
                <option key={f} value={i}>{f.split(',')[0]}</option>
              ))}
            </select>
          </div>
          {[
            ['size', 'Size (rem)', 0.8, 4, 0.05],
            ['lineHeight', 'Line-height', 1, 2.4, 0.05],
            ['weight', 'Font weight', 300, 700, 100],
            ['spacing', 'Letter-spacing (em)', -0.05, 0.3, 0.01],
          ].map(([key, label, min, max, step]) => (
            <div key={key}>
              <div className="viz-label">
                <span>{label}</span>
                <span className="viz-value">{state[key]}</span>
              </div>
              <input type="range" min={min} max={max} step={step} value={state[key]} onChange={(e) => set(key)(Number(e.target.value))} aria-label={label} />
            </div>
          ))}
        </>
      }
      stage={
        <div style={{ width: 640, maxWidth: '100%' }}>
          <div
            style={{
              fontFamily: FAMILIES[state.family],
              fontSize: `calc(${state.size} * 1rem * 0.4)`,
              lineHeight: state.lineHeight,
              fontWeight: state.weight,
              letterSpacing: `${state.spacing}em`,
            }}
          >
            {sampleText}
          </div>
          <hr className="my-4 border-line" />
          <div
            style={{
              fontFamily: FAMILIES[state.family],
              fontSize: `${state.size}rem`,
              lineHeight: state.lineHeight,
              fontWeight: state.weight,
              letterSpacing: `${state.spacing}em`,
              width: 240,
            }}
          >
            {sampleText}
          </div>
        </div>
      }
      initial={() => setState({ ...DEFAULT })}
    />
  );
}
