/**
 * End-to-end order, cancel, return, and exchange checks against the running API.
 * Usage: node src/scripts/test-order-flow.js
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDb, stopMemoryDb } from '../config/db.js';
import { Order } from '../models/Order.js';

const base = 'http://localhost:5000/api';
const customer = { email: 'aman.sharma@theruux.in', password: 'AmanTest1!' };
const address = {
  fullName: 'Aman Sharma',
  phone: '9876543210',
  line1: '12 Link Road',
  city: 'Mumbai',
  state: 'Maharashtra',
  postalCode: '400001',
  country: 'IN',
};

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const call = async (path, { method = 'GET', token, body } = {}) => {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
};

const login = async (email, password) => {
  const res = await call('/auth/login', { method: 'POST', body: { email, password } });
  assert(res.status === 200, `login failed for ${email}: ${res.data.error?.message || res.status}`);
  return res.data.accessToken;
};

const variant = (product, size) => product.variants.find((item) => item.size === size);

const placePair = async (token) => {
  const rebel = (await call('/products/rebel-blue-strapped-embellished-denim-jeans')).data;
  const purpose = (await call('/products/purpose-chase-graphic-tee')).data;
  const rebelSize = variant(rebel, 'M');
  const purposeSize = variant(purpose, 'M');
  for (const [product, size] of [
    [rebel, rebelSize],
    [purpose, purposeSize],
  ]) {
    const added = await call('/cart/items', {
      method: 'POST',
      token,
      body: { productId: product.id, variantId: size.id, quantity: 1 },
    });
    assert(added.status === 200 || added.status === 201, `add to bag failed: ${added.data.error?.message || added.status}`);
  }
  const order = await call('/checkout/create', {
    method: 'POST',
    token,
    body: {
      email: customer.email,
      phone: address.phone,
      shippingAddress: address,
      shippingMethodId: 'standard',
      paymentMethod: 'cod',
    },
  });
  assert(order.status === 200 || order.status === 201, `checkout failed: ${order.data.error?.message || order.status}`);
  assert(order.data.payment?.provider === 'cod', 'expected a cash on delivery order');
  return { orderNumber: order.data.orderNumber, orderId: order.data.orderId, rebelStock: rebelSize.stockQty, purposeStock: purposeSize.stockQty };
};

const deliver = async (admin, orderId) => {
  for (const toStatus of ['SHIPPED', 'DELIVERED']) {
    const step = await call(`/admin/orders/${orderId}/transition`, {
      method: 'POST',
      token: admin,
      body: { toStatus },
    });
    assert(step.status === 200, `could not mark ${toStatus}: ${step.data.error?.message || step.status}`);
  }
};

await connectDb();
const admin = await login(process.env.SEED_ADMIN_EMAIL, process.env.SEED_ADMIN_PASSWORD);
const token = await login(customer.email, customer.password);

const first = await placePair(token);
const placed = await call(`/orders/${first.orderNumber}`, { token });
assert(placed.data.items.length === 2, `expected 2 pieces, got ${placed.data.items?.length}`);
assert(placed.data.actions.canCancel === true, 'a new pending order should be cancellable');
assert(placed.data.actions.canReturn === false, 'a pending order cannot be returned');
const cancelled = await call(`/orders/${first.orderNumber}/cancel`, { method: 'POST', token });
assert(cancelled.status === 200, `cancel failed: ${cancelled.data.error?.message || cancelled.status}`);
assert(cancelled.data.status === 'CANCELLED', 'cancel did not stick');
const rebelAfter = (await call('/products/rebel-blue-strapped-embellished-denim-jeans')).data;
const purposeAfter = (await call('/products/purpose-chase-graphic-tee')).data;
assert(variant(rebelAfter, 'M').stockQty === first.rebelStock, 'REBEL stock was not restored');
assert(variant(purposeAfter, 'M').stockQty === first.purposeStock, 'PURPOSE stock was not restored');

const late = await placePair(token);
await Order.updateOne({ orderNumber: late.orderNumber }, { $set: { placedAt: new Date(Date.now() - 3 * 60 * 60 * 1000) } });
const lateView = await call(`/orders/${late.orderNumber}`, { token });
assert(lateView.data.actions.canCancel === false, 'a 3-hour-old order should not be cancellable');
const lateCancel = await call(`/orders/${late.orderNumber}/cancel`, { method: 'POST', token });
assert(lateCancel.status === 400, 'cancel after 2 hours should be refused');

const fresh = await placePair(token);
await deliver(admin, fresh.orderId);
const delivered = await call(`/orders/${fresh.orderNumber}`, { token });
assert(delivered.data.actions.canReturn === true, 'return should be open just after delivery');
assert(delivered.data.actions.canExchange === true, 'exchange should be open just after delivery');
const empty = await call(`/orders/${fresh.orderNumber}/aftercare`, {
  method: 'POST',
  token,
  body: { type: 'return', reason: 'short' },
});
assert(empty.status === 400, 'a short reason should be refused');
const returned = await call(`/orders/${fresh.orderNumber}/aftercare`, {
  method: 'POST',
  token,
  body: { type: 'return', reason: 'The waist is tighter than the size note.' },
});
assert(returned.status === 200, `return failed: ${returned.data.error?.message || returned.status}`);
assert(returned.data.aftercare.type === 'return', 'return was not saved');

const aged = await placePair(token);
await deliver(admin, aged.orderId);
await Order.updateOne(
  { orderNumber: aged.orderNumber },
  { $set: { deliveredAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) } },
);
const dayFour = await call(`/orders/${aged.orderNumber}`, { token });
assert(dayFour.data.actions.canReturn === false, 'return should close after 3 days');
assert(dayFour.data.actions.canExchange === true, 'exchange should stay open on day 4');
const exchanged = await call(`/orders/${aged.orderNumber}/aftercare`, {
  method: 'POST',
  token,
  body: { type: 'exchange', reason: 'Need the next size up. The medium is short in the rise.' },
});
assert(exchanged.status === 200, `exchange failed: ${exchanged.data.error?.message || exchanged.status}`);

const closed = await placePair(token);
await deliver(admin, closed.orderId);
await Order.updateOne(
  { orderNumber: closed.orderNumber },
  { $set: { deliveredAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) } },
);
const dayEight = await call(`/orders/${closed.orderNumber}/aftercare`, {
  method: 'POST',
  token,
  body: { type: 'exchange', reason: 'This window should already be closed.' },
});
assert(dayEight.status === 400, 'exchange after 7 days should be refused');

const terms = await call('/pages/terms');
const privacy = await call('/pages/privacy');
assert(terms.data.body?.includes('2 hours'), 'terms are missing the cancellation window');
assert(terms.data.body?.includes('3 days'), 'terms are missing the return window');
assert(privacy.data.body?.includes('do not sell'), 'privacy is missing the no-sale line');

const preview = await placePair(token);
await deliver(admin, preview.orderId);

console.log('Order flow passed.');
console.log(`Open /account/orders/${preview.orderNumber} as ${customer.email}`);
await mongoose.disconnect();
await stopMemoryDb();
