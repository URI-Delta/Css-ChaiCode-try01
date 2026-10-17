import { useState, useMemo } from 'react';
import VisualizerShell from './VisualizerShell.jsx';
import './visualizer.css';

const DEFAULT = { a: 10, b: 50, transform: false };

export default function StackingVisualizer({ initial = {} }) {
  const [state, setState] = useState({ ...DEFAULT, ...initial });
  const set = (k) => (v) => setState((s) => ({ ...s, [k]: v }));

  const css = useMemo(
    () => `.site { position: relative; }

/* top group */ 
.group-a {
  position: absolute; z-index: 10;
}
.group-b {
  position: absolute; z-index: ${state.b};${state.transform ? '\n  transform: translateZ(0); /* creates a NEW stacking context! */' : ''}
}
.group-b .inner {
  /* always trapped in .group-b — despite a bigger number */ 
  z-index: 9999;
}`,
    [state]
  );

  return (
    <VisualizerShell
      css={css}
      controls={
        <>
          <div>
            <div className="viz-label">
              <span>Layer B z-index</span>
              <span className="viz-value">{state.b}</span>
            </div>
            <input type="range" min={0} max={100} value={state.b} onChange={(e) => set('b')(Number(e.target.value))} aria-label="Layer B z-index" />
          </div>
          <label className="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" checked={state.transform} onChange={(e) => set('transform')(e.target.checked)} />
            Add a <code className="mx-1 font-mono text-[11px]">transform</code> on Layer B (context!)
          </label>
          <p className="text-[11px] leading-snug text-muted">Try dragging B above 10 — it stacks above A regardless of markup order. Turn the transform on and watch B's innermost child become trapped; its huge z-index stays inside B.</p>
        </>
      }
      stage={
        <div className="stage-bg p-6" style={{ minHeight: 300 }}>
          <div style={{ position: 'relative', minHeight: 230 }}>
            {/* layer A */}
            <div style={{ position: 'absolute', top: 6, left: 6, zIndex: 10 }}>
              <div style={{ width: 170, height: 130, borderRadius: 10, background: 'rgba(127,176,105,.25)', border: '1.5px solid #7fb069', display: 'grid', placeItems: 'center', color: '#eee8d8', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                .group-a (z 10)
              </div>
            </div>
            {/* layer B */}
            <div style={{ position: 'absolute', top: 56, left: 96, zIndex: state.b, ...(state.transform ? { transform: 'translateZ(0)' } : {}) }}>
              <div style={{ width: 190, height: 130, borderRadius: 10, background: 'rgba(255,122,69,.25)', border: '1.5px solid #ff7a45', display: 'grid', placeItems: 'center', color: '#eee8d8', fontFamily: 'var(--font-mono)', fontSize: 11, position: 'relative' }}>
                .group-b (z {state.b})
                <div style={{ position: 'absolute', top: -16, right: -14, zIndex: 9999, background: '#c9a24a', color: '#17130a', padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                  .inner z 9999
                </div>
              </div>
            </div>
          </div>
        </div>
      }
      initial={() => setState({ ...DEFAULT })}
    />
  );
}
