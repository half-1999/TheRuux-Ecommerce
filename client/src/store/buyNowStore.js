import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Ephemeral Buy Now payload — does not touch the shopping cart.
 * Cleared after successful order or when starting a cart checkout.
 */
export const useBuyNowStore = create(
  persist(
    (set, get) => ({
      item: null,
      setItem: (item) => set({ item }),
      clear: () => set({ item: null }),
      hasItem: () => Boolean(get().item?.variantId),
    }),
    { name: 'theruux-buy-now' },
  ),
);
