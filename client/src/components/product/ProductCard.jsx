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
      <div className="relative">
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
        {actions ? (
          <button
            type="button"
            aria-label={`${active ? 'Remove' : 'Add'} ${product.name} ${active ? 'from' : 'to'} wishlist`}
            aria-pressed={active}
            disabled={toggle.isPending}
            className="wish-heart absolute top-3 right-3 z-10 inline-flex cursor-pointer bg-transparent drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)] transition-transform duration-150 active:scale-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-60"
            onClick={() => toggle.mutate({ productId: product.id, isActive: active, product })}
          >
            <span className="relative inline-flex">
              <Heart size={32} weight="regular" className="wish-heart-outline" aria-hidden />
              <Heart size={32} weight="fill" className="wish-heart-fill absolute inset-0" aria-hidden />
            </span>
          </button>
        ) : null}
      </div>
      <div className="mt-3">
        <Link to={href} className="min-w-0 focus-visible:outline-2 focus-visible:outline-offset-2">
          <p className="truncate text-sm font-semibold tracking-wide">{product.name}</p>
          <p className="mt-0.5 truncate text-sm text-[var(--color-text-muted)]">{product.title}</p>
          <p className="mt-1 text-sm font-medium">{formatInr(product.price)}</p>
        </Link>
      </div>
    </motion.article>
  );
}
