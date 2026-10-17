import { useEffect, useRef } from 'react';
import clsx from 'clsx';
import { X } from 'lucide-react';

export function Card({ className, children, as: Tag = 'div', ...props }) {
  return (
    <Tag className={clsx('card-surface p-5', className)} {...props}>
      {children}
    </Tag>
  );
}

export function Badge({ tone = 'default', className, children }) {
  const tones = {
    default: 'bg-elevated text-muted border-line',
    brand: 'bg-brand/10 text-brand border-brand/30',
    success: 'bg-success/10 text-success border-success/30',
    error: 'bg-error/10 text-error border-error/30',
    pro: 'bg-pro/10 text-pro border-pro/30',
  };
  return (
    <span className={clsx('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide', tones[tone], className)}>
      {children}
    </span>
  );
}

export function Input({ className, label, error, id, ...props }) {
  const inputId = id || props.name;
  return (
    <div className="grid gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-muted">
          {label}
        </label>
      )}
      <input id={inputId} className={clsx('input-base', error && 'border-error', className)} aria-invalid={!!error} {...props} />
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}

export function Spinner({ className }) {
  return <span className={clsx('inline-block h-5 w-5 animate-spin rounded-full border-2 border-brand border-t-transparent', className)} role="status" aria-label="Loading" />;
}

export function Skeleton({ className }) {
  return <div className={clsx('skeleton', className)} aria-hidden />;
}

export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-line p-10 text-center">
      {icon && <div className="text-3xl" aria-hidden>{icon}</div>}
      <h3 className="font-semibold">{title}</h3>
      {description && <p className="max-w-sm text-sm text-muted">{description}</p>}
      {action}
    </div>
  );
}

export function Modal({ open, onClose, title, children, footer, wide }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    ref.current?.querySelector('button, input, [tabindex]')?.focus();
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label={title} className={clsx('card-surface max-h-[85vh] w-full overflow-auto p-6 shadow-2xl', wide ? 'max-w-2xl' : 'max-w-md')}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close dialog">
            <X size={16} />
          </button>
        </div>
        {children}
        {footer && <div className="mt-5 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

/** Controlled confirm dialog with promise-free usage. */
export function ConfirmDialog({ open, title = 'Are you sure?', body, confirmLabel = 'Confirm', danger, onConfirm, onCancel }) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className={clsx('btn', danger ? 'btn-danger' : 'btn-primary')} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm text-muted">{body}</p>
    </Modal>
  );
}
