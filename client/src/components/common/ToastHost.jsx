import { useUIStore } from '../../store/uiStore.js';
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from 'lucide-react';
import clsx from 'clsx';

const icons = { info: Info, success: CheckCircle2, warn: AlertTriangle, error: XCircle };
const tones = { info: 'text-muted', success: 'text-success', warn: 'text-pro', error: 'text-error' };

export default function ToastHost() {
  const toasts = useUIStore((s) => s.toasts);
  const dismiss = useUIStore((s) => s.dismissToast);
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[60] flex w-80 max-w-[calc(100vw-2.5rem)] flex-col gap-2" aria-live="polite">
      {toasts.map((t) => {
        const Icon = icons[t.kind] || Info;
        return (
          <div key={t.id} className="card-surface pointer-events-auto flex items-start gap-2.5 p-3 shadow-lg" role="status">
            <Icon size={17} className={clsx('mt-0.5 shrink-0', tones[t.kind])} aria-hidden />
            <p className="flex-1 text-sm leading-snug">{t.message}</p>
            <button className="btn btn-ghost btn-sm !p-1" onClick={() => dismiss(t.id)} aria-label="Dismiss notification">
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
