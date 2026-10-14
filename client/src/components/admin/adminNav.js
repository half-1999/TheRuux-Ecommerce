import {
  CreditCard,
  GearSix,
  Layout,
  ListDashes,
  Package,
  Plus,
  Receipt,
  SquaresFour,
  Stack,
  Star,
  Tag,
  Truck,
  TShirt,
  Users,
} from '@phosphor-icons/react';

export const NAV_ICONS = {
  dashboard: SquaresFour,
  products: TShirt,
  categories: Tag,
  collections: Stack,
  inventory: Package,
  orders: Receipt,
  customers: Users,
  payments: CreditCard,
  shipping: Truck,
  homepage: Layout,
  navigation: ListDashes,
  settings: GearSix,
  plus: Plus,
  star: Star,
};

/** Used when no saved config exists or the API is unreachable. */
export const DEFAULT_NAV = [
  { id: 'dashboard', label: 'Dashboard', to: '/admin', icon: 'dashboard', group: '', enabled: true },
  { id: 'products', label: 'Products', to: '/admin/products', icon: 'products', group: 'Catalog', enabled: true },
  { id: 'categories', label: 'Categories', to: '/admin/categories', icon: 'categories', group: 'Catalog', enabled: true },
  { id: 'collections', label: 'Collections', to: '/admin/collections', icon: 'collections', group: 'Catalog', enabled: true },
  { id: 'inventory', label: 'Inventory', to: '/admin/inventory', icon: 'inventory', group: 'Catalog', enabled: true },
  { id: 'orders', label: 'Orders', to: '/admin/orders', icon: 'orders', group: 'Sales', enabled: true },
  { id: 'customers', label: 'Customers', to: '/admin/customers', icon: 'customers', group: 'Sales', enabled: true },
  { id: 'payments', label: 'Payments', to: '/admin/payments', icon: 'payments', group: 'Sales', enabled: true },
  { id: 'shipping', label: 'Shipping', to: '/admin/shipping', icon: 'shipping', group: 'Sales', enabled: true },
  { id: 'homepage', label: 'Homepage CMS', to: '/admin/homepage', icon: 'homepage', group: 'Content', enabled: true },
  { id: 'navigation', label: 'Navigation', to: '/admin/navigation', icon: 'navigation', group: 'Store', enabled: true },
  { id: 'settings', label: 'Settings', to: '/admin/settings', icon: 'settings', group: 'Store', enabled: true },
];

/** Consecutive items with the same group render under one heading. */
export const groupNav = (items) => {
  const groups = [];
  for (const item of items) {
    const last = groups[groups.length - 1];
    if (last && last.name === item.group) last.items.push(item);
    else groups.push({ name: item.group, items: [item] });
  }
  return groups;
};
