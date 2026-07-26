import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);
export const useToast = () => useContext(ToastContext);

const ICONS = { success: CheckCircle2, error: AlertTriangle, info: Info };
const TONE = {
  success: 'border-go/40 text-go',
  error: 'border-signal/50 text-signal',
  info: 'border-info/40 text-info',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const push = useCallback((message, tone = 'info', ttl = 4500) => {
    const id = crypto.randomUUID();
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => dismiss(id), ttl);
  }, [dismiss]);

  const value = useMemo(() => ({
    success: (m) => push(m, 'success'),
    error: (m) => push(m, 'error'),
    info: (m) => push(m, 'info'),
  }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-[60] flex w-[min(92vw,22rem)] flex-col gap-2" role="status" aria-live="polite">
        {toasts.map((t) => {
          const Icon = ICONS[t.tone];
          return (
            <div key={t.id} className={`panel animate-slide-in flex items-start gap-3 p-3 ${TONE[t.tone]}`}>
              <Icon size={17} className="mt-0.5 shrink-0" />
              <p className="flex-1 text-sm text-paper">{t.message}</p>
              <button onClick={() => dismiss(t.id)} className="text-mist hover:text-paper" aria-label="Dismiss">
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
