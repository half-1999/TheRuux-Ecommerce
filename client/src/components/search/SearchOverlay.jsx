import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { catalogApi } from '../../api/client';
import { useUiStore } from '../../store/uiStore';
import { EASE } from '../../animations/motion';

export function SearchOverlay() {
  const open = useUiStore((s) => s.searchOpen);
  const close = useUiStore((s) => s.closeSearch);
  const [q, setQ] = useState('');

  const { data, isFetching } = useQuery({
    queryKey: ['search-overlay', q],
    queryFn: () => catalogApi.search(q.trim()),
    enabled: open && q.trim().length > 0,
  });

  const results = data?.items || [];

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && close();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, close]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[var(--z-modal)] bg-[var(--color-bg)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28, ease: EASE }}
        >
          <div className="mx-auto max-w-[var(--container)] px-[var(--space-header-x)] pt-8">
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs uppercase tracking-[var(--tracking-caps)] text-[var(--color-text-subtle)]">
                Search
              </p>
              <button
                type="button"
                className="min-h-11 text-sm"
                onClick={() => {
                  setQ('');
                  close();
                }}
              >
                Close
              </button>
            </div>
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search TheRuux…"
              className="mt-6 w-full border-0 border-b border-[var(--color-border)] bg-transparent py-4 text-2xl outline-none placeholder:text-[var(--color-text-subtle)]"
            />
            <div className="mt-8 max-h-[70vh] overflow-y-auto">
              {isFetching ? <p className="text-sm text-[var(--color-text-muted)]">Looking…</p> : null}
              {!isFetching && q && results.length === 0 ? (
                <div>
                  <p className="font-semibold tracking-wide">WE LOOKED. NOTHING.</p>
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">Try something else.</p>
                </div>
              ) : null}
              <ul className="divide-y divide-[var(--color-border)]">
                {results.map((item) => (
                  <li key={item.id}>
                    <Link
                      to={`/product/${item.slug}`}
                      onClick={() => {
                        setQ('');
                        close();
                      }}
                      className="flex min-h-14 items-center justify-between py-3"
                    >
                      <span>
                        <span className="font-medium">{item.name}</span>
                        <span className="ml-2 text-[var(--color-text-muted)]">{item.title}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              {q ? (
                <Link
                  to={`/search?q=${encodeURIComponent(q)}`}
                  onClick={() => {
                    setQ('');
                    close();
                  }}
                  className="mt-6 inline-block text-sm uppercase tracking-[var(--tracking-caps)] underline"
                >
                  View all results
                </Link>
              ) : null}
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
