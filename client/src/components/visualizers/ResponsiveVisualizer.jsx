import { useState, useMemo, useEffect } from 'react';
import VisualizerShell from './VisualizerShell.jsx';
import './visualizer.css';

const DEVICES = [
  { label: 'Mobile', width: 375 },
  { label: 'Tablet', width: 768 },
  { label: 'Laptop', width: 1024 },
  { label: 'Desktop', width: 1440 },
];

const DEFAULT = { device: 1, minSize: 1.25, pref: 5, maxSize: 3.5 };

export default function ResponsiveVisualizer({ initial = {} }) {
  const [state, setState] = useState({ ...DEFAULT, ...initial });
  const device = DEVICES[state.device];
  const set = (k) => (v) => setState((s) => ({ ...s, [k]: v }));
  const [sliderWidth, setSliderWidth] = useState(600);

  // simulate a browser resize with a slider, honest mapping: 300-1440
  const effectiveWidth = sliderWidth;

  const fontSizeClamp = useMemo(() => {
    const feetPerPct = (effectiveWidth * 16) / 100; // 1vw in px = width/100; rem=16px
    const prefPx = (state.pref / 100) * effectiveWidth; // clamp uses vw relative to viewport
    return Math.max(state.minSize * 16, Math.min(prefPx, state.maxSize * 16));
  }, [effectiveWidth, state]);

  const css = useMemo(
    () => `h1 {
  font-size: clamp(${state.minSize}rem, ${state.pref}vw, ${state.maxSize}rem);
}
/* viewport ${effectiveWidth}px → computed ${Math.round(fontSizeClamp)}px */`,
    [state, effectiveWidth, fontSizeClamp]
  );

  return (
    <VisualizerShell
      css={css}
      controls={
        <>
          <div>
            <div className="viz-label"><span>Preset device</span></div>
            <div className="grid grid-cols-4 gap-1.5">
              {DEVICES.map((d, i) => (
                <button key={d.width} className={`btn btn-sm ${i === state.device ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { setState((s) => ({ ...s, device: i })); setSliderWidth(d.width); }}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="viz-label">
              <span>Viewport width</span>
              <span className="viz-value">{effectiveWidth}px</span>
            </div>
            <input type="range" min={320} max={1440} value={effectiveWidth} onChange={(e) => setSliderWidth(Number(e.target.value))} aria-label="Viewport width" />
          </div>
          {[
            ['minSize', 'clamp min (rem)', 1, 2.5, 0.05],
            ['pref', 'preferred (vw)', 1, 8, 0.5],
            ['maxSize', 'clamp max (rem)', 2, 5, 0.05],
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
        <div className="stage-bg p-4" style={{ minHeight: 340 }}>
          <div style={{ width: effectiveWidth, maxWidth: '100%', margin: '0 auto', border: '1px dashed var(--border)', borderRadius: 10, padding: 16, background: 'var(--card)', resize: 'both', overflow: 'hidden' }}>
            <div
              style={{
                fontSize: fontSizeClamp,
                fontWeight: 700,
                fontFamily: 'var(--font-ui)',
                lineHeight: 1.2,
                color: 'var(--text)',
                whiteSpace: 'nowrap',
              }}
            >
              CSS you can see.
            </div>
            <div className="mt-2 text-xs text-muted" style={{ fontFamily: 'var(--font-mono)' }}>
              computed h1: {Math.round(fontSizeClamp)}px — {effectiveWidth > 900 ? 'desktop layout' : effectiveWidth > 700 ? 'tablet layout' : 'mobile layout'}
            </div>
          </div>
        </div>
      }
      initial={() => setState({ ...DEFAULT })}
    />
  );
}
