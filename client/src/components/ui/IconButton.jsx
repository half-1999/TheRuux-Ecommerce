import clsx from 'clsx';

export function IconButton({
  children,
  label,
  className,
  badge,
  inverted = false,
  ...props
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className={clsx(
        'relative inline-flex h-11 w-11 items-center justify-center transition-[transform,color,background-color] duration-[var(--dur-fast)] ease-[var(--ease-editorial)] active:scale-[0.98]',
        inverted
          ? 'text-[#F5F2EC] hover:bg-white/10'
          : 'text-[#141414] hover:bg-[var(--color-bg-muted)]',
        className,
      )}
      {...props}
    >
      {children}
      {badge != null && Number(badge) > 0 ? (
        <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center bg-[#103020] px-1 text-[10px] font-semibold text-[#F5F2EC]">
          {badge > 99 ? '99+' : badge}
        </span>
      ) : null}
    </button>
  );
}
