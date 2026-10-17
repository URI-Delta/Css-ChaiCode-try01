import { Card, Skeleton } from '../../components/common/ui.jsx';

export function Metric({ label, value, hint, tone }) {
  return (
    <Card>
      <div className="text-xs text-muted">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${tone || ''}`}>{value ?? <Skeleton className="h-8 w-20" />}</div>
      {hint && <div className="mt-0.5 text-[11px] text-muted">{hint}</div>}
    </Card>
  );
}

export function AdminError({ message }) {
  return (
    <Card className="!border-error/40 text-sm text-error">
      {message}
    </Card>
  );
}

export function th(children, key) {
  return <th key={key} className="border-b border-line px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-muted">{children}</th>;
}

export function Table({ head, children }) {
  return (
    <div className="card-surface overflow-x-auto">
      <table className="w-full text-sm">
        <thead>{head}</thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function td(children, key, className = '') {
  return (
    <td key={key} className={`border-b border-line px-3 py-2 ${className}`}>
      {children}
    </td>
  );
}
