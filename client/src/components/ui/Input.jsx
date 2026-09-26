import clsx from 'clsx';
import { forwardRef } from 'react';

export const Input = forwardRef(function Input(
  { label, id, error, className, hint, ...props },
  ref,
) {
  const inputId = id || props.name;

  return (
    <label className={clsx('flex w-full flex-col gap-2', className)} htmlFor={inputId}>
      {label ? (
        <span className="text-xs font-medium uppercase tracking-[var(--tracking-caps)] text-[var(--color-text-muted)]">
          {label}
        </span>
      ) : null}
      <input
        ref={ref}
        id={inputId}
        className={clsx(
          'min-h-11 w-full border-0 border-b bg-transparent px-0 py-2 text-[var(--color-text)] outline-none transition-colors duration-[var(--dur-fast)] placeholder:text-[var(--color-text-subtle)]',
          error
            ? 'border-[var(--color-danger)]'
            : 'border-[var(--color-border)] focus:border-[var(--color-brand)]',
        )}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        {...props}
      />
      {hint && !error ? (
        <span id={`${inputId}-hint`} className="text-xs text-[var(--color-text-subtle)]">
          {hint}
        </span>
      ) : null}
      {error ? (
        <span id={`${inputId}-error`} className="text-xs text-[var(--color-danger)]" role="alert">
          {error}
        </span>
      ) : null}
    </label>
  );
});
