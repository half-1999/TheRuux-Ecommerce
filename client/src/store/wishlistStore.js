import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const snapshot = (product) => {
  if (!product?.id) return null;
  let sizes = product.sizes;
  if (!sizes && product.variants?.length) {
    const map = new Map();
    for (const variant of product.variants) {
      const current = map.get(variant.size);
      if (!current || (variant.available && !current.available)) {
        map.set(variant.size, {
          size: variant.size,
          variantId: variant.id,
          available: Boolean(variant.available),
        });
      }
    }
    sizes = [...map.values()];
  }
  return {
    id: product.id,
    name: product.name,
    title: product.title,
    slug: product.slug,
    price: product.price,
    image: product.image || product.images?.[0] || null,
    allowsPersonalization: Boolean(product.allowsPersonalization),
    sizes: sizes || [],
  };
};

export const useGuestWishlist = create(
  persist(
    (set, get) => ({
      items: [],
      toggle(product) {
        const next = snapshot(product);
        if (!next) return get().items;
        const exists = get().items.some((item) => item.id === next.id);
        const items = exists
          ? get().items.filter((item) => item.id !== next.id)
          : [...get().items, next];
        set({ items });
        return items;
      },
      clear() {
        set({ items: [] });
      },
    }),
    { name: 'theruux-wishlist' },
  ),
);
