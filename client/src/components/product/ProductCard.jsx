import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { formatInr } from '../../lib/media';
import { useAddToCart, useCart } from '../../hooks/useCart';
import { useToggleWishlist, useWishlist } from '../../hooks/useWishlist';
import { useToastStore } from '../../store/toastStore';
import { staggerItem } from '../../animations/motion';

export function ProductCard({ product }) {
  const navigate = useNavigate();
  const { data } = useWishlist();
  const { data: cart } = useCart();
  const add = useAddToCart();
  const toggle = useToggleWishlist();
  const push = useToastStore((s) => s.push);
  const [sizesOpen, setSizesOpen] = useState(false);
  const active = Boolean(data?.items?.some((p) => p.id === product.id || p.slug === product.slug));
  const inBag = Boolean(cart?.items?.some((item) => item.product?.id === product.id));
  const sizes = product.sizes || [];

  const chooseSize = (size) => {
    if (!size.available || add.isPending) return;
    if (product.allowsPersonalization) {
      push({ title: 'Add front text', message: 'Open the piece and add the name before it goes in the bag.' });
      navigate(`/product/${product.slug}`);
      return;
    }
    add.mutate({
      productId: product.id,
      variantId: size.variantId,
      quantity: 1,
    });
  };

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
          {inBag && !sizesOpen ? (
            <span className="absolute bottom-3 left-3 bg-[#1c4332] px-2 py-1 text-[10px] font-semibold uppercase tracking-[var(--tracking-caps)] text-[#F5F2EC]">
              Added
            </span>
          ) : null}
        </div>
        <div className="mt-3 pr-2">
          <p className="text-sm font-semibold tracking-wide">{product.name}</p>
          <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">{product.title}</p>
          <p className="mt-1 text-sm font-medium">{formatInr(product.price)}</p>
        </div>
      </Link>

      <div
        className="absolute right-2 top-2 z-10 flex items-start gap-1"
        onMouseLeave={() => setSizesOpen(false)}
      >
        <div className="relative" onMouseEnter={() => setSizesOpen(true)}>
          <button
            type="button"
            aria-label={inBag ? 'In bag' : 'Add to bag'}
            aria-expanded={sizesOpen}
            className={`inline-flex h-11 w-11 items-center justify-center transition-transform active:scale-[0.92] ${
              inBag ? 'bg-[#1c4332] text-[#F5F2EC]' : 'bg-[#F5F2EC]/90 text-[#141414]'
            }`}
            onClick={(event) => {
              event.preventDefault();
              setSizesOpen((open) => !open);
            }}
          >
            <ShoppingBag size={20} weight={inBag ? 'fill' : 'light'} />
          </button>
          {sizesOpen ? (
            <div className="absolute right-0 top-12 flex w-max max-w-[14rem] flex-wrap justify-end gap-1 bg-[#F5F2EC] p-2 shadow-[var(--shadow-soft)]">
              {sizes.length ? (
                sizes.map((size) => {
                  const selected = Boolean(
                    cart?.items?.some((item) => item.variantId === size.variantId),
                  );
                  return (
                    <button
                      key={size.variantId}
                      type="button"
                      disabled={!size.available}
                      className={`min-h-9 min-w-9 border px-2 text-xs disabled:opacity-30 ${
                        selected
                          ? 'border-[#1c4332] bg-[#1c4332] text-[#F5F2EC]'
                          : 'border-[var(--color-border)] bg-transparent text-[#141414]'
                      }`}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        chooseSize(size);
                      }}
                    >
                      {selected ? 'Added' : size.size}
                    </button>
                  );
                })
              ) : (
                <Link to={`/product/${product.slug}`} className="px-2 py-1 text-xs underline">
                  View sizes
                </Link>
              )}
            </div>
          ) : null}
        </div>
        <button
          type="button"
          aria-label={active ? 'Remove from wishlist' : 'Add to wishlist'}
          aria-pressed={active}
          className={`inline-flex h-11 w-11 items-center justify-center transition-transform active:scale-[0.92] ${
            active ? 'bg-[#F5F2EC] text-[#1c4332]' : 'bg-black/0 text-white mix-blend-difference'
          }`}
          onClick={(event) => {
            event.preventDefault();
            toggle.mutate({ productId: product.id, isActive: active, product });
          }}
        >
          <Heart
            size={20}
            weight={active ? 'fill' : 'light'}
            className={active ? 'text-[var(--color-brand)] mix-blend-normal' : ''}
          />
        </button>
      </div>
    </motion.article>
  );
}
