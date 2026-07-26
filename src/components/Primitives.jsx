import { Loader2, Inbox } from 'lucide-react';
import { STATUS_STYLE, SEVERITY_STYLE } from '../lib/constants.js';

export const Spinner = ({ label = 'Loading' }) => (
  <div className="flex items-center justify-center gap-2 py-12 text-mist">
    <Loader2 size={16} className="animate-spin" />
    <span className="text-sm">{label}</span>
  </div>
);

export const StatusChip = ({ status }) => {
  const s = STATUS_STYLE[status] || STATUS_STYLE.resolved;
  return <span className={`chip ${s.cls}`}>{s.label}</span>;
};

export const SeverityChip = ({ severity }) => (
  <span className={`chip ${(SEVERITY_STYLE[severity] || SEVERITY_STYLE.low).cls}`}>{severity}</span>
);

/** Empty states are an invitation to act, not an apology. */
export const EmptyState = ({ title, hint, action }) => (
  <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
    <div className="rounded-full border border-line bg-ink-700 p-3 text-mist"><Inbox size={20} /></div>
    <p className="h-display text-base text-paper">{title}</p>
    {hint && <p className="max-w-sm text-sm text-mist">{hint}</p>}
    {action}
  </div>
);

export const Pagination = ({ meta, onPage }) => {
  if (!meta || meta.pages <= 1) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-line">
      <p className="text-xs text-mist">
        Page <span className="text-paper">{meta.page}</span> of {meta.pages} · {meta.total} records
      </p>
      <div className="flex gap-2">
        <button className="btn-ghost btn-sm" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}>
          Previous
        </button>
        <button className="btn-ghost btn-sm" disabled={meta.page >= meta.pages} onClick={() => onPage(meta.page + 1)}>
          Next
        </button>
      </div>
    </div>
  );
};

export const Panel = ({ title, subtitle, action, children, className = '' }) => (
  <section className={`panel ${className}`}>
    {(title || action) && (
      <header className="panel-head">
        <div>
          {title && <h2 className="h-display text-sm text-paper">{title}</h2>}
          {subtitle && <p className="mt-0.5 text-xs text-mist">{subtitle}</p>}
        </div>
        {action}
      </header>
    )}
    {children}
  </section>
);
