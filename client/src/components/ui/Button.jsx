import clsx from 'clsx';

/** Explicit hex colors — avoids CSS-var + Tailwind arbitrary text/bg failures (invisible buttons). */
const variants = {
  primary: 'bg-[#141414] text-[#F5F2EC] hover:bg-[#103020] hover:text-[#F5F2EC]',
  secondary:
    'border border-[#1a1a1a] bg-transparent text-[#141414] hover:bg-[#ebe6dc] hover:text-[#141414]',
  ghost: 'bg-transparent text-[#141414] hover:bg-[#ebe6dc]',
  inverse: 'bg-[#F5F2EC] text-[#141414] hover:bg-[#d8e0da] hover:text-[#141414]',
  danger: 'bg-[#8b1e1e] text-[#F5F2EC] hover:opacity-90',
};

export function Button({
  children,
  variant = 'primary',
  className,
  loading = false,
  disabled,
  type = 'button',
  trailingIcon,
  ...props
}) {
  return (
    <button
      type={type}
      className={clsx(
        'inline-flex min-h-11 items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium tracking-wide transition-[transform,background-color,color,opacity] duration-[var(--dur-fast)] ease-[var(--ease-editorial)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40',
        variants[variant],
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      <span className="relative z-[1]">{loading ? 'Loading…' : children}</span>
      {trailingIcon ? (
        <span
          className="relative z-[1] inline-flex h-7 w-7 items-center justify-center border border-current/25"
          aria-hidden
        >
          {trailingIcon}
        </span>
      ) : null}
    </button>
  );
}
