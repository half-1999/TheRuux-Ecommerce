import { Link } from 'react-router-dom';
import { Heart } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { formatInr } from '../../lib/media';
import { useToggleWishlist, useWishlist } from '../../hooks/useWishlist';
import { staggerItem } from '../../animations/motion';

export function ProductCard({ product, actions = true }) {
  const { data } = useWishlist();
  const toggle = useToggleWishlist();
  const active = Boolean(data?.items?.some((p) => p.id === product.id || p.slug === product.slug));
  const href = `/product/${product.slug}`;

  return (
    <motion.article variants={staggerItem} className="group relative">
      {/* Image link is a duplicate of the text link, so keep it out of the tab order. */}
      <Link to={href} className="block" tabIndex={-1} aria-hidden="true">
        <div className="relative aspect-[3/4] overflow-hidden bg-[var(--color-bg-muted)]">
          {product.image?.url ? (
            <img
              src={product.image.url}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 ease-[var(--ease-editorial)] group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs uppercase tracking-[var(--tracking-caps)] text-[var(--color-text-subtle)]">
              {product.name}
            </div>
          )}
        </div>
      </Link>
      <div className="mt-3 flex items-start justify-between gap-3">
        <Link to={href} className="min-w-0 flex-1 focus-visible:outline-2 focus-visible:outline-offset-2">
          <p className="truncate text-sm font-semibold tracking-wide">{product.name}</p>
          <p className="mt-0.5 truncate text-sm text-[var(--color-text-muted)]">{product.title}</p>
          <p className="mt-1 text-sm font-medium">{formatInr(product.price)}</p>
        </Link>
        {actions ? (
          <button
            type="button"
            aria-label={`${active ? 'Remove' : 'Add'} ${product.name} ${active ? 'from' : 'to'} wishlist`}
            aria-pressed={active}
            disabled={toggle.isPending}
            className={`inline-flex h-10 w-10 shrink-0 items-center justify-center border transition-[background-color,color,border-color,transform] duration-150 active:scale-[0.92] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand)] disabled:opacity-60 ${
              active
                ? 'border-[var(--color-brand)] bg-[var(--color-brand)] text-[#F5F2EC]'
                : 'border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]'
            }`}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              toggle.mutate({ productId: product.id, isActive: active, product });
            }}
          >
            <Heart size={18} weight={active ? 'fill' : 'regular'} aria-hidden />
          </button>
        ) : null}
      </div>
    </motion.article>
  );
}
