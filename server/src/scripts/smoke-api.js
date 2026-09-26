/**
 * Phase 2 smoke checks — cart stock + admin authz + webhook mock confirm.
 * Requires server running on PORT (default 5000) and seeded DB.
 */
const BASE = process.env.API_URL || 'http://localhost:5000/api';

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
  return { status: res.status, data, headers: res.headers };
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function main() {
  console.log('Smoke: health');
  const health = await req('/health');
  assert(health.status === 200 && health.data.ok, 'health failed');

  console.log('Smoke: products');
  const products = await req('/products');
  assert(products.data.items?.length >= 1, 'expected seeded products');
  const product = products.data.items[0];

  const detail = await req(`/products/${product.slug}`);
  assert(detail.data.variants?.length >= 1, 'expected variants');
  const variant = detail.data.variants[0];

  console.log('Smoke: guest cart add');
  const add = await req('/cart/items', {
    method: 'POST',
    body: {
      productId: detail.data.id,
      variantId: variant.id,
      quantity: 1,
    },
    headers: { 'X-Guest-Token': 'smoke-guest-token-1' },
  });
  assert(add.status === 201 || add.status === 200, `cart add failed: ${JSON.stringify(add.data)}`);
  assert(add.data.items?.length >= 1, 'cart empty after add');

  console.log('Smoke: admin rejected for customer');
  const customerEmail = `smoke_${Date.now()}@test.com`;
  const reg = await req('/auth/register', {
    method: 'POST',
    body: { name: 'Smoke', email: customerEmail, password: 'password123' },
  });
  assert(reg.data.accessToken, 'register failed');
  const forbidden = await req('/admin/metrics', { token: reg.data.accessToken });
  assert(forbidden.status === 403, 'admin should reject customer');

  console.log('Smoke: admin login + metrics');
  const adminLogin = await req('/auth/login', {
    method: 'POST',
    body: {
      email: process.env.SEED_ADMIN_EMAIL || 'admin@theruux.com',
      password: process.env.SEED_ADMIN_PASSWORD || 'TheruuxAdmin1!',
    },
  });
  assert(adminLogin.data.accessToken, 'admin login failed — run npm run seed');
  const metrics = await req('/admin/metrics', { token: adminLogin.data.accessToken });
  assert(metrics.status === 200, 'admin metrics failed');
  assert(typeof metrics.data.ordersToday === 'number', 'metrics shape');

  console.log('Smoke: checkout create (mock razorpay)');
  const checkout = await req('/checkout/create', {
    method: 'POST',
    headers: { 'X-Guest-Token': 'smoke-guest-token-1' },
    body: {
      email: 'checkout@test.com',
      phone: '9999999999',
      shippingAddress: {
        fullName: 'Smoke Tester',
        phone: '9999999999',
        line1: '12 Test Street',
        city: 'Mumbai',
        state: 'MH',
        postalCode: '400001',
        country: 'IN',
      },
    },
  });
  assert(checkout.status === 201, `checkout failed: ${JSON.stringify(checkout.data)}`);
  assert(checkout.data.payment?.razorpayOrderId, 'missing razorpay order');

  console.log('Smoke: payment confirm (mock)');
  const confirm = await req('/payments/confirm', {
    method: 'POST',
    body: {
      razorpayOrderId: checkout.data.payment.razorpayOrderId,
      razorpayPaymentId: `pay_mock_${Date.now()}`,
      razorpaySignature: 'dev',
    },
  });
  assert(confirm.status === 200 && confirm.data.paymentStatus === 'PAID', `confirm failed: ${JSON.stringify(confirm.data)}`);

  // stock should have decremented
  const after = await req(`/products/${product.slug}`);
  const vAfter = after.data.variants.find((v) => v.id === variant.id);
  assert(vAfter.stockQty === variant.stockQty - 1, 'stock not decremented after payment');

  console.log('All Phase 2 smoke checks passed.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
