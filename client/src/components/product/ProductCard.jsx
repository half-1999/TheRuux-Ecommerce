import { Link } from 'react-router-dom';
import { Heart } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { formatInr } from '../../lib/media';
import { useToggleWishlist, useWishlist } from '../../hooks/useWishlist';
import { useAuthStore } from '../../store/authStore';
import { staggerItem } from '../../animations/motion';

export function ProductCard({ product }) {
  const user = useAuthStore((s) => s.user);
  const { data } = useWishlist();
  const toggle = useToggleWishlist();
  const active = Boolean(
    user && data?.items?.some((p) => p.id === product.id || p.slug === product.slug),
  );

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
      <button
        type="button"
        aria-label={active ? 'Remove from wishlist' : 'Add to wishlist'}
        aria-pressed={active}
        className="absolute right-2 top-2 inline-flex h-11 w-11 items-center justify-center bg-black/0 text-white mix-blend-difference transition-transform active:scale-[0.92]"
        onClick={(e) => {
          e.preventDefault();
          toggle.mutate({ productId: product.id, isActive: active });
        }}
      >
        <Heart
          size={20}
          weight={active ? 'fill' : 'light'}
          className={active ? 'text-[var(--color-brand)] mix-blend-normal' : ''}
        />
      </button>
    </motion.article>
  );
}
