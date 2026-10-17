import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { Card } from '../../components/common/ui.jsx';

export default function AuthCard({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-4 py-12">
      <Link to="/" className="mb-6 font-bold tracking-tight">
        CSS <span className="text-brand">Visual</span>
      </Link>
      <Card className="w-full max-w-sm">
        <h1 className="text-lg font-semibold">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
        <div className="mt-5">{children}</div>
      </Card>
      {footer && <div className="mt-4 text-sm text-muted">{footer}</div>}
    </div>
  );
}

export function FormError({ message }) {
  if (!message) return null;
  return (
    <div role="alert" className="mb-1 flex items-start gap-2 rounded-lg border border-error/30 bg-error/10 p-2.5 text-xs text-error">
      <AlertCircle size={14} className="mt-0.5 shrink-0" aria-hidden />
      <span>{message}</span>
    </div>
  );
}
