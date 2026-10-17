import { useState, useMemo } from 'react';
import VisualizerShell from './VisualizerShell.jsx';
import './visualizer.css';

const PRESETS = {
  pulse: `@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.15); }
}`,
  float: `@keyframes float {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-24px); }
}`,
  spin: `@keyframes spin {
  to { transform: rotate(360deg); }
}`,
  slide: `@keyframes slide {
  0%, 100% { transform: translateX(0); }
  50%      { transform: translateX(60px); }
}`,
  fade: `@keyframes fade {
  0%, 100% { opacity: 1; }
  50%      { opacity: .35; }
}`,
};

const EASINGS = ['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out'];
const DEFAULT = { preset: 'pulse', duration: 1.5, easing: 'ease-in-out', delay: 0 };

export default function AnimationVisualizer({ initial = {} }) {
  const [state, setState] = useState({ ...DEFAULT, ...initial });
  const set = (k) => (v) => setState((s) => ({ ...s, [k]: v }));

  const css = useMemo(
    () => `${PRESETS[state.preset]}

.demo {
  animation: ${state.preset} ${state.duration}s ${state.easing} ${state.delay}s infinite;
}`,
    [state]
  );

  return (
    <VisualizerShell
      css={css}
      controls={
        <>
          <div>
            <div className="viz-label"><span>Keyframe preset</span></div>
            <select className="select-viz" value={state.preset} onChange={(e) => set('preset')(e.target.value)} aria-label="Animation preset">
              {Object.keys(PRESETS).map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>
          {[
            ['duration', 'Duration (s)', 0.2, 4, 0.1],
            ['delay', 'Delay (s)', 0, 2, 0.1],
          ].map(([key, label, min, max, step]) => (
            <div key={key}>
              <div className="viz-label">
                <span>{label}</span>
                <span className="viz-value">{state[key]}s</span>
              </div>
              <input type="range" min={min} max={max} step={step} value={state[key]} onChange={(e) => set(key)(Number(e.target.value))} aria-label={label} />
            </div>
          ))}
          <div>
            <div className="viz-label"><span>Easing</span><span className="viz-value">{state.easing}</span></div>
            <select className="select-viz" value={state.easing} onChange={(e) => set('easing')(e.target.value)} aria-label="Easing function">
              {EASINGS.map((e) => (
                <option key={e}>{e}</option>
              ))}
            </select>
          </div>
          <p className="text-[11px] leading-snug text-muted">All presets animate <code className="font-mono">transform</code> or <code className="font-mono">opacity</code> only — the two compositor-safe properties.</p>
        </>
      }
      stage={
        <div className="stage-bg grid place-items-center overflow-hidden p-8" style={{ minHeight: 280 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #ff7a45, #c9a24a)',
              animation: `${state.preset} ${state.duration}s ${state.easing} ${state.delay}s infinite`,
              willChange: 'transform, opacity',
            }}
            aria-label="animation demo box"
          />
        </div>
      }
      initial={() => setState({ ...DEFAULT })}
    />
  );
}
