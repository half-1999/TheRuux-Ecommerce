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

  return (
    <motion.article variants={staggerItem} className="group relative">
      <Link to={`/product/${product.slug}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden bg-[var(--color-bg-muted)]">
          {product.image?.url ? (
            <img
              src={product.image.url}
              alt={product.image.alt || `${product.name} ${product.title}`}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 ease-[var(--ease-editorial)] group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs uppercase tracking-[var(--tracking-caps)] text-[var(--color-text-subtle)]">
              {product.name}
            </div>
          )}
        </div>
        <div className="mt-3 pr-2">
          <p className="text-sm font-semibold tracking-wide">{product.name}</p>
          <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">{product.title}</p>
          <p className="mt-1 text-sm font-medium">{formatInr(product.price)}</p>
        </div>
      </Link>

      {actions ? (
        <button
          type="button"
          aria-label={active ? 'Remove from wishlist' : 'Add to wishlist'}
          aria-pressed={active}
          className={`absolute right-2 top-2 z-10 inline-flex h-11 w-11 items-center justify-center bg-white/90 text-[#141414] transition-[transform,background-color,color] duration-150 active:scale-[0.92] ${
            active ? 'text-[#1c4332]' : ''
          }`}
          onClick={(event) => {
            event.preventDefault();
            toggle.mutate({ productId: product.id, isActive: active, product });
          }}
        >
          <Heart size={20} weight={active ? 'fill' : 'light'} />
        </button>
      ) : null}
    </motion.article>
  );
}
