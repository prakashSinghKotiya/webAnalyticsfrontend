import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

const ToastContext = createContext(null);

const DEFAULT_DURATION = 4000;
const MAX_TOASTS = 5;

let nextId = 1;

const VARIANTS = Object.freeze({
  success: { icon: '✓', className: 'text-[var(--green)] border-[var(--green)]/30 bg-[var(--green-dim)]' },
  error: { icon: '!', className: 'text-[var(--red)] border-[var(--red)]/30 bg-[var(--red)]/10' },
  info: { icon: 'i', className: 'text-[var(--cyan)] border-[var(--border-bright)] bg-[var(--cyan-dim)]' },
});

/**
 * ToastProvider — app-wide notification system.
 *
 * Usage:
 *   const toast = useToast();
 *   toast.success('Saved');            // auto-dismisses
 *   toast.error('Failed', { duration: 0 }); // sticky until closed
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (message, { variant = 'info', duration = DEFAULT_DURATION } = {}) => {
      const id = nextId++;
      setToasts((prev) => [...prev.slice(-(MAX_TOASTS - 1)), { id, message, variant }]);
      if (duration > 0) {
        timersRef.current.set(
          id,
          setTimeout(() => dismiss(id), duration),
        );
      }
      return id;
    },
    [dismiss],
  );

  // Clear pending timers on unmount.
  useEffect(
    () => () => {
      timersRef.current.forEach((t) => clearTimeout(t));
      timersRef.current.clear();
    },
    [],
  );

  const toast = useMemo(
    () => ({
      success: (message, options) => push(message, { ...options, variant: 'success' }),
      error: (message, options) => push(message, { ...options, variant: 'error' }),
      info: (message, options) => push(message, { ...options, variant: 'info' }),
      dismiss,
    }),
    [push, dismiss],
  );

  const value = useMemo(() => ({ toast, toasts, dismiss }), [toast, toasts, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

function ToastViewport({ toasts, onDismiss }) {
  if (!toasts.length) return null;
  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-[min(92vw,360px)] flex-col gap-2"
    >
      {toasts.map(({ id, message, variant }) => {
        const v = VARIANTS[variant] ?? VARIANTS.info;
        return (
          <div
            key={id}
            role="status"
            className="fade-up pointer-events-auto flex items-start gap-3 rounded-xl border bg-[var(--surface)] p-3.5 shadow-[var(--shadow-card-hover)]"
          >
            <span
              className={`flex h-6 w-6 flex-none items-center justify-center rounded-full border text-xs font-bold ${v.className}`}
            >
              {v.icon}
            </span>
            <p className="flex-1 text-sm leading-snug text-[var(--text)]">{message}</p>
            <button
              type="button"
              onClick={() => onDismiss(id)}
              aria-label="Dismiss notification"
              className="cursor-pointer rounded-md bg-transparent border-none p-0.5 text-[var(--muted)] transition hover:text-[var(--text)]"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}

/** Global toast helpers: { success, error, info, dismiss }. */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context.toast;
}

export default ToastContext;
