import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

let idSeq = 0;

const ICONS = { success: CheckCircle, error: AlertCircle, warning: AlertCircle, info: Info };
const COLORS = {
  success: 'var(--status-green)',
  error: 'var(--status-terracotta)',
  warning: 'var(--gold-500)',
  info: 'var(--status-blue)',
};

function ToastItem({ message, type, onDismiss }) {
  const Icon = ICONS[type] || Info;
  const color = COLORS[type] || COLORS.info;
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-lg bg-white shadow-lg p-4 animate-in"
      style={{ borderLeft: `4px solid ${color}` }}
    >
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color }} aria-hidden="true" />
      <p className="flex-1 text-sm" style={{ color: 'var(--brown-900)' }}>{message}</p>
      <button onClick={onDismiss} className="p-0.5 rounded hover:opacity-70" aria-label="Dismiss notification">
        <X className="w-4 h-4" style={{ color: 'var(--rust-600)' }} aria-hidden="true" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++idSeq;
    setToasts((list) => [...list, { id, message, type }]);
    if (duration > 0) setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div
        className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]"
        role="region"
        aria-live="polite"
        aria-label="Notifications"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} message={t.message} type={t.type} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// Safe even if a component renders outside the provider (returns no-ops).
export function useToast() {
  return useContext(ToastContext) || { toast: () => {}, dismiss: () => {} };
}
