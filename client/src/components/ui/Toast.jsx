import { AnimatePresence, motion } from 'framer-motion';
import { useToastStore } from '../../store/toastStore';

export function ToastViewport() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div
      className="pointer-events-none fixed bottom-6 right-6 z-[var(--z-toast)] flex w-[min(100%-2rem,22rem)] flex-col gap-2"
      aria-live="polite"
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
            className="pointer-events-auto border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-4 py-3 shadow-[var(--shadow-soft)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold tracking-[var(--tracking-caps)] uppercase">
                  {toast.title}
                </p>
                {toast.message ? (
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">{toast.message}</p>
                ) : null}
              </div>
              <button
                type="button"
                className="min-h-8 text-xs text-[var(--color-text-subtle)]"
                onClick={() => dismiss(toast.id)}
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
