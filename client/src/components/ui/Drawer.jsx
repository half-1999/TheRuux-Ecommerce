import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import clsx from 'clsx';

export function Drawer({ open, onClose, side = 'left', title, children, className }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const fromLeft = side === 'left';

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close overlay"
            className="fixed inset-0 z-[var(--z-drawer)] bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={title || 'Drawer'}
            className={clsx(
              'fixed top-0 z-[var(--z-drawer)] flex h-full w-[min(100%,22rem)] flex-col bg-[var(--color-bg-elevated)] shadow-[var(--shadow-soft)]',
              fromLeft ? 'left-0' : 'right-0',
              className,
            )}
            initial={{ x: fromLeft ? '-100%' : '100%' }}
            animate={{ x: 0 }}
            exit={{ x: fromLeft ? '-100%' : '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 36 }}
          >
            {title ? (
              <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
                <h2 className="text-sm font-semibold tracking-[var(--tracking-caps)] uppercase">
                  {title}
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-11 px-2 text-sm text-[var(--color-text-muted)]"
                >
                  Close
                </button>
              </div>
            ) : null}
            <div className="flex-1 overflow-y-auto">{children}</div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
