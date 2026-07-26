import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, subtitle, children, footer, width = 'max-w-lg' }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/80 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="absolute inset-0" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`panel relative w-full ${width} max-h-[92vh] overflow-y-auto rounded-b-none sm:rounded-lg`}
      >
        <header className="panel-head sticky top-0 z-10 bg-ink-800">
          <div>
            <h2 className="h-display text-sm text-paper">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-mist">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="text-mist hover:text-paper" aria-label="Close">
            <X size={18} />
          </button>
        </header>
        <div className="p-4">{children}</div>
        {footer && <footer className="flex justify-end gap-2 border-t border-line px-4 py-3">{footer}</footer>}
      </div>
    </div>
  );
}
