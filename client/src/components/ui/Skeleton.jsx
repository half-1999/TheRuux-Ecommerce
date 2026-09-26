import clsx from 'clsx';

export function Skeleton({ className }) {
  return (
    <div className={clsx('animate-pulse bg-[var(--color-bg-muted)]', className)} aria-hidden />
  );
}
