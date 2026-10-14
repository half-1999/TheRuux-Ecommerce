/**
 * Admin / catalog / CMS integration checks on a throwaway in-memory MongoDB.
 * Never touches the real database. Usage: npm run test:admin --prefix server
 */
import assert from 'node:assert/strict';

process.env.MONGODB_URI = 'memory';
process.env.NODE_ENV = 'test';

const { connectDb, stopMemoryDb } = await import('../config/db.js');
const { createApp } = await import('../app.js');
const { User } = await import('../models/User.js');
const { Product } = await import('../models/Product.js');
const { Variant } = await import('../models/Variant.js');
const { Order } = await import('../models/Order.js');
const bcrypt = (await import('bcryptjs')).default;

await connectDb();
const server = createApp().listen(0);
const BASE = `http://127.0.0.1:${server.address().port}/api`;

const call = async (path, { method = 'GET', body, token } = {}) => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json().catch(() => ({})) };
};

const login = async (email, role) => {
  await User.create({ name: role, email, role, passwordHash: await bcrypt.hash('password123', 4) });
  return (await call('/auth/login', { method: 'POST', body: { email, password: 'password123' } })).data.accessToken;
};

const results = [];
const check = async (name, fn) => {
  try {
    await fn();
    results.push(['PASS', name]);
  } catch (err) {
    results.push(['FAIL', name, err.message]);
  }
};

const admin = await login('admin@test.local', 'admin');
const customer = await login('cust@test.local', 'customer');
const as = (path, opts = {}) => call(path, { ...opts, token: admin });

let category;
let collection;
let product;

await check('admin endpoints reject anonymous and customers', async () => {
  assert.equal((await call('/admin/categories')).status, 401);
  assert.equal((await call('/admin/categories', { token: customer })).status, 403);
  assert.equal((await call('/admin/homepage/hero', { method: 'PATCH', token: customer, body: { title: 'x' } })).status, 403);
});

await check('category and collection create', async () => {
  const c = await as('/admin/categories', { method: 'POST', body: { name: 'Outerwear', imageUrl: '/img/outer.jpg', description: 'Layers' } });
  assert.equal(c.status, 201, JSON.stringify(c.data));
  category = c.data;
  assert.equal(category.slug, 'outerwear');
  const col = await as('/admin/collections', { method: 'POST', body: { name: 'Monsoon Edit' } });
  assert.equal(col.status, 201);
  collection = col.data;
  const dup = await as('/admin/categories', { method: 'POST', body: { name: 'Outerwear' } });
  assert.equal(dup.status, 409, 'duplicate slug should be 409');
});

await check('editing a category name keeps its image', async () => {
  const r = await as(`/admin/categories/${category._id}`, { method: 'PATCH', body: { name: 'Outer Layers' } });
  assert.equal(r.data.name, 'Outer Layers');
  assert.equal(r.data.imageUrl, '/img/outer.jpg');
});

await check('product rejects unknown or malformed relationship ids', async () => {
  const bad = await as('/admin/products', { method: 'POST', body: { name: 'X', title: 'Y', basePrice: 10, categoryIds: ['nope'] } });
  assert.equal(bad.status, 400);
  const missing = await as('/admin/products', {
    method: 'POST',
    body: { name: 'X', title: 'Y', basePrice: 10, categoryIds: ['64b000000000000000000000'] },
  });
  assert.equal(missing.status, 400);
  const price = await as('/admin/products', { method: 'POST', body: { name: 'X', title: 'Y', basePrice: 100, compareAtPrice: 50 } });
  assert.equal(price.status, 400, 'compare-at below price should fail');
});

await check('create product with category + collection, publish, visible on storefront', async () => {
  const r = await as('/admin/products', {
    method: 'POST',
    body: {
      name: 'DRIFT',
      title: 'Rain Shell',
      basePrice: 4990,
      compareAtPrice: 5990,
      categoryIds: [category._id],
      collectionIds: [collection._id],
      variants: [{ sku: 'TR-DRF-BK-M', size: 'M', colourName: 'Black', stockQty: 3 }],
    },
  });
  assert.equal(r.status, 201, JSON.stringify(r.data));
  product = r.data.product;
  assert.equal((await call('/categories/outerwear')).data.items.length, 0, 'draft must stay hidden');
  await as(`/admin/products/${product._id}`, { method: 'PATCH', body: { status: 'active' } });
  assert.equal((await call('/categories/outerwear')).data.items[0]?.slug, product.slug);
  assert.equal((await call('/collections/monsoon-edit')).data.products.length, 1);
  assert.equal((await call('/products?category=outerwear')).data.total, 1);
});

await check('edit form round-trips assignments and counts are real', async () => {
  const detail = await as(`/admin/products/${product._id}`);
  assert.deepEqual(detail.data.product.categoryIds.map(String), [category._id]);
  const cats = await as('/admin/categories');
  const row = cats.data.items.find((c) => c.id === category._id);
  assert.deepEqual(row.productCount, { total: 1, active: 1 });
  const unassign = await as(`/admin/products/${product._id}/categories`, { method: 'PUT', body: { categoryIds: [] } });
  assert.equal(unassign.status, 200);
  assert.equal((await call('/categories/outerwear')).data.items.length, 0);
  await as(`/admin/products/${product._id}`, { method: 'PATCH', body: { categoryIds: [category._id] } });
});

await check('admin product list: SKU search, category filter, stock summary', async () => {
  const r = await as(`/admin/products?q=DRF-BK&category=${category._id}`);
  assert.equal(r.data.total, 1);
  assert.equal(r.data.items[0].stockTotal, 3);
  assert.equal(r.data.items[0].categories[0].name, 'Outer Layers');
  assert.equal((await as('/admin/products?q=(((')).status, 200, 'regex input must be escaped');
});

await check('disabling a category hides it publicly but keeps product links', async () => {
  await as(`/admin/categories/${category._id}`, { method: 'DELETE' });
  assert.equal((await call('/categories/outerwear')).status, 404);
  const p = await Product.findById(product._id).lean();
  assert.equal(p.categoryIds.length, 1);
  await as(`/admin/categories/${category._id}`, { method: 'PATCH', body: { isActive: true } });
});

await check('homepage draft stays private until publish', async () => {
  const list = await as('/admin/homepage');
  const hero = list.data.items.find((s) => s.key === 'hero');
  assert.ok(hero, 'hero section listed even before it exists');
  const saved = await as('/admin/homepage/hero', { method: 'PATCH', body: { title: 'New Season.', ctaHref: '/shop' } });
  assert.equal(saved.status, 200, JSON.stringify(saved.data));
  const before = await call('/homepage');
  assert.notEqual(before.data.sections.find((s) => s.key === 'hero')?.title, 'New Season.');
  const pub = await as('/admin/homepage/hero/publish', { method: 'POST' });
  assert.equal(pub.status, 200);
  const after = await call('/homepage');
  assert.equal(after.data.sections.find((s) => s.key === 'hero').title, 'New Season.');
  assert.equal(after.data.sections.find((s) => s.key === 'hero').draft, undefined);
});

await check('homepage rejects unsafe links, unknown keys, stale edits', async () => {
  assert.equal((await as('/admin/homepage/hero', { method: 'PATCH', body: { ctaHref: 'javascript:alert(1)' } })).status, 400);
  assert.equal((await as('/admin/homepage/hero', { method: 'PATCH', body: { ctaHref: '//evil.com' } })).status, 400);
  assert.equal((await as('/admin/homepage/nope', { method: 'PATCH', body: { title: 'x' } })).status, 404);
  assert.equal((await as('/admin/homepage/hero', { method: 'PATCH', body: { key: 'x' } })).status, 400);
  const stale = await as('/admin/homepage/hero', {
    method: 'PATCH',
    body: { title: 'A', expectedUpdatedAt: '2000-01-01T00:00:00.000Z' },
  });
  assert.equal(stale.status, 409);
});

await check('navigation config validates routes and persists', async () => {
  const bad = await as('/admin/navigation', {
    method: 'PUT',
    body: { items: [{ id: 'x', label: 'Evil', to: 'https://evil.com', icon: 'star', group: '', enabled: true }] },
  });
  assert.equal(bad.status, 400);
  const items = [{ id: 'orders', label: 'Orders', to: '/admin/orders', icon: 'orders', group: 'Sales', enabled: true }];
  assert.equal((await as('/admin/navigation', { method: 'PUT', body: { items } })).status, 200);
  assert.equal((await as('/admin/navigation')).data.items[0].label, 'Orders');
  await as('/admin/navigation', { method: 'PUT', body: { items: null } });
  assert.equal((await as('/admin/navigation')).data.items, null);
});

await check('settings PATCH rejects fields outside the whitelist', async () => {
  assert.equal((await as('/admin/settings', { method: 'PATCH', body: { paymentMethods: [] } })).status, 400);
  assert.equal((await as('/admin/settings', { method: 'PATCH', body: { lowStockThreshold: 4 } })).status, 200);
});

const variant = await Variant.findOne({ sku: 'TR-DRF-BK-M' });

await check('stock adjustments never go negative, even concurrently', async () => {
  assert.equal((await as('/admin/inventory/adjust', { method: 'POST', body: { variantId: variant.id, delta: -4, reason: 'test' } })).status, 400);
  const runs = await Promise.all(
    [1, 2, 3, 4, 5].map(() => as('/admin/inventory/adjust', { method: 'POST', body: { variantId: variant.id, delta: -1, reason: 'race' } })),
  );
  assert.equal(runs.filter((r) => r.status === 200).length, 3);
  assert.equal((await Variant.findById(variant.id)).stockQty, 0);
  await as('/admin/inventory/adjust', { method: 'POST', body: { variantId: variant.id, delta: 5, reason: 'restock' } });
  const inv = await as('/admin/inventory?q=DRIFT');
  assert.equal(inv.data.items[0].stockQty, 5, 'product-name search');
});

const makeOrder = (paymentMethod, n) =>
  Order.create({
    orderNumber: `TEST-${n}`,
    email: 'buyer@test.local',
    paymentMethod,
    subtotal: 4990,
    grandTotal: 4990,
    items: [{ variantId: variant._id, productId: product._id, sku: variant.sku, productName: 'DRIFT', unitPrice: 4990, quantity: 2, lineTotal: 9980 }],
  });

await check('order transitions follow the status map and reserve stock once', async () => {
  const cod = await makeOrder('cod', 1);
  assert.equal((await as(`/admin/orders/${cod.id}/transition`, { method: 'POST', body: { toStatus: 'DELIVERED' } })).status, 400);
  assert.equal((await as(`/admin/orders/${cod.id}/transition`, { method: 'POST', body: { toStatus: 'PROCESSING' } })).status, 200);
  assert.equal((await Variant.findById(variant.id)).stockQty, 3);
  assert.equal((await as(`/admin/orders/${cod.id}/transition`, { method: 'POST', body: { toStatus: 'SHIPPED' } })).status, 200);
  assert.equal((await Variant.findById(variant.id)).stockQty, 3, 'no double decrement');
  assert.equal((await as(`/admin/orders/${cod.id}/transition`, { method: 'POST', body: { toStatus: 'CANCELLED' } })).status, 200);
  assert.equal((await Variant.findById(variant.id)).stockQty, 5, 'cancel releases stock');
});

await check('unverified online payments cannot be fulfilled or marked paid by admin', async () => {
  const online = await makeOrder('cashfree', 2);
  const r = await as(`/admin/orders/${online.id}/transition`, { method: 'POST', body: { toStatus: 'PROCESSING' } });
  assert.equal(r.status, 400);
  assert.equal((await as(`/admin/orders/${online.id}/transition`, { method: 'POST', body: { toStatus: 'PAID' } })).status, 400);
  assert.equal((await Order.findById(online.id)).paymentStatus, 'PENDING');
  const list = await as('/admin/orders?q=TEST-2');
  assert.deepEqual(list.data.items[0].transitions, ['PROCESSING', 'FAILED', 'CANCELLED']);
});

await check('customer list reports orders and only paid spend', async () => {
  const user = await User.findOne({ email: 'cust@test.local' });
  await Order.create({ orderNumber: 'TEST-3', userId: user._id, email: user.email, subtotal: 100, grandTotal: 100, paymentStatus: 'PAID', status: 'PAID' });
  await Order.create({ orderNumber: 'TEST-4', userId: user._id, email: user.email, subtotal: 900, grandTotal: 900 });
  const r = await as('/admin/customers?q=cust@');
  assert.equal(r.data.items[0].orderCount, 2);
  assert.equal(Number(r.data.items[0].totalSpend), 100);
  const detail = await as(`/admin/customers/${user.id}`);
  assert.equal(detail.data.user.passwordHash, undefined);
});

await check('dashboard metrics come from real counts', async () => {
  const m = await as('/admin/metrics');
  assert.equal(m.status, 200);
  assert.equal(m.data.catalog.active, 1);
  assert.equal(m.data.catalog.categories, 1);
  assert.equal(m.data.ordersTotal, 4);
  assert.equal(Number(m.data.paidRevenue), 100);
});

server.close();
await stopMemoryDb();

for (const [state, name, why] of results) console.log(`${state}  ${name}${why ? `\n      ${why}` : ''}`);
const failed = results.filter((r) => r[0] === 'FAIL').length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
