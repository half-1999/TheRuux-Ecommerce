import { useAuthStore } from '../store/authStore';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const GUEST_KEY = 'theruux_guest';

export const getGuestToken = () => {
  let token = localStorage.getItem(GUEST_KEY);
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(GUEST_KEY, token);
  }
  return token;
};

async function request(path, { method = 'GET', body, token, headers, guest = false } = {}) {
  const accessToken = token ?? useAuthStore.getState().accessToken;
  const res = await fetch(`${API_URL}${path}`, {
    method,
    credentials: 'include',
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(guest ? { 'X-Guest-Token': getGuestToken() } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.error?.message || 'Request failed');
    err.code = data?.error?.code;
    err.status = res.status;
    err.details = data?.error?.details;
    throw err;
  }
  return data;
}

export const api = {
  get: (path, opts) => request(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => request(path, { ...opts, method: 'POST', body }),
  patch: (path, body, opts) => request(path, { ...opts, method: 'PATCH', body }),
  delete: (path, opts) => request(path, { ...opts, method: 'DELETE' }),
};

export const catalogApi = {
  homepage: () => api.get('/homepage'),
  products: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return api.get(`/products${q ? `?${q}` : ''}`);
  },
  product: (slug) => api.get(`/products/${slug}`),
  newArrivals: (limit = 4) => api.get(`/products/new-arrivals?limit=${limit}`),
  bestsellers: (limit = 12) => api.get(`/products/bestsellers?limit=${limit}`),
  categories: () => api.get('/categories'),
  category: (slug, params = {}) => {
    const q = new URLSearchParams(params).toString();
    return api.get(`/categories/${slug}${q ? `?${q}` : ''}`);
  },
  collection: (slug) => api.get(`/collections/${slug}`),
  search: (q) => api.get(`/search?q=${encodeURIComponent(q)}`),
  page: (slug) => api.get(`/pages/${slug}`),
  subscribe: (email) => api.post('/newsletter/subscribe', { email }),
  contact: (payload) => api.post('/contact', payload),
};

export const cartApi = {
  get: () => api.get('/cart', { guest: true }),
  add: (payload) => api.post('/cart/items', payload, { guest: true }),
  update: (id, quantity) => api.patch(`/cart/items/${id}`, { quantity }, { guest: true }),
  remove: (id) => api.delete(`/cart/items/${id}`, { guest: true }),
  merge: () => api.post('/cart/merge', null, { guest: true }),
};

export const wishlistApi = {
  get: () => api.get('/wishlist'),
  add: (productId) => api.post('/wishlist/items', { productId }),
  remove: (productId) => api.delete(`/wishlist/items/${productId}`),
  merge: (productIds) => api.post('/wishlist/merge', { productIds }),
};

export const checkoutApi = {
  preview: (payload) => api.post('/checkout/preview', payload, { guest: true }),
  create: (payload) => api.post('/checkout/create', payload, { guest: true }),
  confirmPayment: (payload) => api.post('/payments/confirm', payload),
  paymentStatus: (orderId) => api.get(`/payments/${orderId}/status`),
};

export const ordersApi = {
  list: () => api.get('/orders'),
  get: (orderNumber) => api.get(`/orders/${orderNumber}`),
};

export const meApi = {
  get: () => api.get('/me'),
  update: (payload) => api.patch('/me', payload),
  addresses: () => api.get('/me/addresses'),
  createAddress: (payload) => api.post('/me/addresses', payload),
  updateAddress: (id, payload) => api.patch(`/me/addresses/${id}`, payload),
  deleteAddress: (id) => api.delete(`/me/addresses/${id}`),
  setDefaultAddress: (id) => api.post(`/me/addresses/${id}/default`),
};

const q = (params = {}) => {
  const s = new URLSearchParams(params).toString();
  return s ? `?${s}` : '';
};

export const adminApi = {
  metrics: () => api.get('/admin/metrics'),
  analytics: (params) => api.get(`/admin/analytics/overview${q(params)}`),
  products: (params) => api.get(`/admin/products${q(params)}`),
  product: (id) => api.get(`/admin/products/${id}`),
  createProduct: (body) => api.post('/admin/products', body),
  updateProduct: (id, body) => api.patch(`/admin/products/${id}`, body),
  archiveProduct: (id) => api.post(`/admin/products/${id}/archive`),
  addImages: (id, images) => api.post(`/admin/products/${id}/images`, { images }),
  deleteImage: (id, imageId) => api.delete(`/admin/products/${id}/images/${imageId}`),
  createVariant: (id, body) => api.post(`/admin/products/${id}/variants`, body),
  updateVariant: (id, body) => api.patch(`/admin/variants/${id}`, body),
  deactivateVariant: (id) => api.delete(`/admin/variants/${id}`),
  setProductInstagram: (id, urls) => api.put(`/admin/products/${id}/instagram`, { urls }),
  setProductCategories: (id, categoryIds) =>
    api.put(`/admin/products/${id}/categories`, { categoryIds }),
  setProductCollections: (id, collectionIds) =>
    api.put(`/admin/products/${id}/collections`, { collectionIds }),
  categories: () => api.get('/admin/categories'),
  createCategory: (body) => api.post('/admin/categories', body),
  updateCategory: (id, body) => api.patch(`/admin/categories/${id}`, body),
  deleteCategory: (id) => api.delete(`/admin/categories/${id}`),
  collections: () => api.get('/admin/collections'),
  createCollection: (body) => api.post('/admin/collections', body),
  updateCollection: (id, body) => api.patch(`/admin/collections/${id}`, body),
  inventory: (params) => api.get(`/admin/inventory${q(params)}`),
  adjustInventory: (body) => api.post('/admin/inventory/adjust', body),
  inventoryHistory: (variantId) => api.get(`/admin/inventory/${variantId}/history`),
  orders: (params) => api.get(`/admin/orders${q(params)}`),
  order: (id) => api.get(`/admin/orders/${id}`),
  transitionOrder: (id, body) => api.post(`/admin/orders/${id}/transition`, body),
  customers: (params) => api.get(`/admin/customers${q(params)}`),
  customer: (id) => api.get(`/admin/customers/${id}`),
  setCustomerStatus: (id, status) => api.post(`/admin/customers/${id}/status`, { status }),
  homepage: () => api.get('/admin/homepage'),
  patchHomepage: (key, body) => api.patch(`/admin/homepage/${key}`, body),
  setHomepageInstagram: (links) => api.put('/admin/instagram/homepage', { links }),
  page: (slug) => api.get(`/admin/pages/${slug}`),
  upsertPage: (slug, body) => api.patch(`/admin/pages/${slug}`, body),
  settings: () => api.get('/admin/settings'),
  patchSettings: (body) => api.patch('/admin/settings', body),
};
