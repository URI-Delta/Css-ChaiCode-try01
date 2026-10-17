import { useEffect, useState } from 'react';
import { Check, Copy, RotateCcw } from 'lucide-react';
import { useUIStore } from '../../store/uiStore.js';

const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const toast = useUIStore((s) => s.toast);
  return (
    <button
      className="btn btn-secondary btn-sm shrink-0"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        } catch {
          toast('Clipboard blocked by the browser', 'warn');
        }
      }}
    >
      {copied ? <Check size={13} /> : <Copy size={13} />} Copy CSS
    </button>
  );
};

/** Generic visualizer chassis: left controls, right stage, generated CSS strip. */
export default function VisualizerShell({ css, controls, stage, footer, initial }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
      <div className="card-surface flex flex-col gap-4 p-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted">Controls</div>
        <div className="grid content-start gap-4">{controls}</div>
        <footer className="mt-auto flex flex-col gap-2 pt-2">
          <CopyButton text={css} />
          {initial != null && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                if (typeof initial === 'function') initial();
              }}
            >
              <RotateCcw size={13} /> Reset
            </button>
          )}
          {footer}
        </footer>
      </div>
      <div className="flex flex-col gap-4">
        <div className="card-surface min-h-[280px] overflow-auto p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted">Preview</div>
          <div className="mt-3">{stage}</div>
        </div>
        <div className="card-surface p-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Generated CSS</div>
          <pre className="overflow-x-auto rounded-lg border border-line bg-surface p-3 font-mono text-[12px] leading-relaxed">{css}</pre>
        </div>
      </div>
    </div>
  );
}
