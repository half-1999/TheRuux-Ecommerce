import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
  persist(
    (set) => ({
      itemCount: 0,
      setItemCount: (itemCount) => set({ itemCount }),
      bump: () => set((s) => ({ itemCount: s.itemCount + 1 })),
    }),
    { name: 'theruux-cart-ui' },
  ),
);
