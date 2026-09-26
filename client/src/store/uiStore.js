import { create } from 'zustand';

export const useUiStore = create((set) => ({
  menuOpen: false,
  cartOpen: false,
  searchOpen: false,
  openMenu: () => set({ menuOpen: true, searchOpen: false }),
  closeMenu: () => set({ menuOpen: false }),
  toggleMenu: () => set((s) => ({ menuOpen: !s.menuOpen, searchOpen: false })),
  openCart: () => set({ cartOpen: true, menuOpen: false, searchOpen: false }),
  closeCart: () => set({ cartOpen: false }),
  openSearch: () => set({ searchOpen: true, menuOpen: false, cartOpen: false }),
  closeSearch: () => set({ searchOpen: false }),
}));
