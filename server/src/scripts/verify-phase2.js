/**
 * Self-contained Phase 2 verification (in-memory Mongo).
 * Does not require Atlas — validates models, cart, admin authz, payment capture.
 */
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

process.env.NODE_ENV = 'development';
process.env.MONGODB_URI = 'memory';
process.env.JWT_ACCESS_SECRET = 'theruux-test-access-secret-32';
process.env.JWT_REFRESH_SECRET = 'theruux-test-refresh-secret-32';
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.PORT = '5055';

const mem = await MongoMemoryServer.create();
process.env.MONGODB_URI = mem.getUri('theruux');

// Dynamic imports after env is set
const { connectDb } = await import('../config/db.js');
const { createApp } = await import('../app.js');
const { User } = await import('../models/User.js');
const { Category } = await import('../models/Category.js');
const { Collection } = await import('../models/Collection.js');
const { Product } = await import('../models/Product.js');
const { Variant } = await import('../models/Variant.js');

await connectDb();

const cat = await Category.create({ name: 'Shirts', slug: 'shirts', sortOrder: 1 });
const col = await Collection.create({
  name: 'Udbhav',
  slug: 'udbhav',
  tagline: 'Origin',
  story: 'Test',
});
const product = await Product.create({
  name: 'AARAMBH',
  title: 'Ivory Zip Shirt',
  slug: 'aarambh-ivory-zip-shirt',
  basePrice: 5490,
  status: 'active',
  isNewArrival: true,
  categoryIds: [cat._id],
  collectionIds: [col._id],
  images: [{ url: 'https://placehold.co/400', alt: 'AARAMBH', kind: 'front' }],
  namingNote: 'PROVISIONAL: AARAMBH vs ARAMBH',
  publishedAt: new Date(),
});
const variant = await Variant.create({
  productId: product._id,
  sku: 'TR-AAR-IV-M',
  size: 'M',
  colourName: 'Ivory',
  colourHex: '#F5F0E6',
  stockQty: 5,
});

await User.create({
  name: 'Admin',
  email: 'admin@theruux.com',
  passwordHash: await bcrypt.hash('TheruuxAdmin1!', 10),
  role: 'admin',
});
await User.create({
  name: 'Customer',
  email: 'cust@theruux.com',
  passwordHash: await bcrypt.hash('password123', 10),
  role: 'customer',
});

const app = createApp();
const server = app.listen(5055);

const BASE = 'http://127.0.0.1:5055/api';

async function req(path, { method = 'GET', body, token, headers } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

try {
  const health = await req('/health');
  assert(health.data.ok, 'health');

  const products = await req('/products');
  assert(products.data.items.length === 1, 'products list');

  const add = await req('/cart/items', {
    method: 'POST',
    headers: { 'X-Guest-Token': 'verify-guest' },
    body: { productId: product._id.toString(), variantId: variant._id.toString(), quantity: 2 },
  });
  assert(add.status === 201, `cart add ${JSON.stringify(add.data)}`);

  const overstock = await req('/cart/items', {
    method: 'POST',
    headers: { 'X-Guest-Token': 'verify-guest-2' },
    body: { productId: product._id.toString(), variantId: variant._id.toString(), quantity: 99 },
  });
  assert(overstock.status === 409 && overstock.data.error.code === 'OUT_OF_STOCK', 'stock guard');

  const custLogin = await req('/auth/login', {
    method: 'POST',
    body: { email: 'cust@theruux.com', password: 'password123' },
  });
  const forbidden = await req('/admin/metrics', { token: custLogin.data.accessToken });
  assert(forbidden.status === 403, 'admin authz');

  const adminLogin = await req('/auth/login', {
    method: 'POST',
    body: { email: 'admin@theruux.com', password: 'TheruuxAdmin1!' },
  });
  const metrics = await req('/admin/metrics', { token: adminLogin.data.accessToken });
  assert(metrics.status === 200, 'admin metrics');

  const checkout = await req('/checkout/create', {
    method: 'POST',
    headers: { 'X-Guest-Token': 'verify-guest' },
    body: {
      email: 'buyer@test.com',
      shippingAddress: {
        fullName: 'Buyer',
        phone: '9999999999',
        line1: '1 St',
        city: 'Mumbai',
        state: 'MH',
        postalCode: '400001',
        country: 'IN',
      },
    },
  });
  assert(checkout.status === 201, `checkout ${JSON.stringify(checkout.data)}`);

  const confirm = await req('/payments/confirm', {
    method: 'POST',
    body: {
      razorpayOrderId: checkout.data.payment.razorpayOrderId,
      razorpayPaymentId: 'pay_mock_1',
      razorpaySignature: 'dev',
    },
  });
  assert(confirm.data.paymentStatus === 'PAID', `confirm ${JSON.stringify(confirm.data)}`);

  const v = await Variant.findById(variant._id);
  assert(v.stockQty === 3, `stock expected 3 got ${v.stockQty}`);

  console.log('Phase 2 in-memory verification passed.');
} finally {
  server.close();
  await mongoose.disconnect();
  await mem.stop();
}
