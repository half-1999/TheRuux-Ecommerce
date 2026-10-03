import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
  persist(
    (set) => ({
      itemCount: 0,
      setItemCount: (itemCount) => set({ itemCount }),
    }),
    { name: 'theruux-cart-ui' },
  ),
);
