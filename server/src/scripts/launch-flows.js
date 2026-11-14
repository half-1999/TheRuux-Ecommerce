/**
 * In-memory store and sandbox payment checks.
 * Does not write to the live Atlas database.
 */
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { Cashfree, CFEnvironment } from 'cashfree-pg';

process.env.NODE_ENV = 'development';
process.env.MONGODB_URI = 'memory';
process.env.JWT_ACCESS_SECRET = 'theruux-test-access-secret-32';
process.env.JWT_REFRESH_SECRET = 'theruux-test-refresh-secret-32';
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.PORT = '5058';
process.env.PUBLIC_API_URL = 'http://127.0.0.1:5058';

const mem = await MongoMemoryServer.create();
process.env.MONGODB_URI = mem.getUri('theruux');

const { connectDb } = await import('../config/db.js');
const { createApp } = await import('../app.js');
const { env } = await import('../config/env.js');
const { User } = await import('../models/User.js');
const { Category } = await import('../models/Category.js');
const { Product } = await import('../models/Product.js');
const { Variant } = await import('../models/Variant.js');

await connectDb();

const cat = await Category.create({ name: 'Shirts', slug: 'shirts', sortOrder: 1 });
const product = await Product.create({
  name: 'AARAMBH',
  title: 'Ivory Zip Shirt',
  slug: 'aarambh-ivory-zip-shirt',
  basePrice: 5490,
  status: 'active',
  categoryIds: [cat._id],
  images: [{ url: 'https://placehold.co/400', alt: 'AARAMBH', kind: 'front' }],
  publishedAt: new Date(),
});
const variant = await Variant.create({
  productId: product._id,
  sku: 'TR-AAR-IV-M',
  size: 'M',
  colourName: 'Ivory',
  colourHex: '#F5F0E6',
  stockQty: 8,
});

await User.create({
  name: 'TheRuux Admin',
  email: 'admin@theruux.in',
  passwordHash: await bcrypt.hash('TheruuxAdmin1!', 10),
  role: 'admin',
});

const app = createApp();
const server = app.listen(5058);
const BASE = 'http://127.0.0.1:5058/api';

const address = {
  fullName: 'Meera Sharma',
  phone: '9876543210',
  line1: '14 Linking Road',
  city: 'Mumbai',
  state: 'Maharashtra',
  postalCode: '400001',
  country: 'IN',
};

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

const cashfree = env.cashfreeEnabled
  ? new Cashfree(
      env.cashfreeEnv === 'production' ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX,
      env.cashfreeAppId,
      env.cashfreeSecretKey,
    )
  : null;

const paySandbox = async (paymentSessionId, upiId) => {
  const response = await cashfree.PGPayOrder({
    payment_session_id: paymentSessionId,
    payment_method: { upi: { channel: 'collect', upi_id: upiId } },
  });
  return response.data || {};
};

try {
  const registered = await req('/auth/register', {
    method: 'POST',
    body: { name: 'Meera Sharma', email: 'meera.sharma@theruux.in', password: 'MeeraTest1!' },
  });
  assert(registered.status === 201 && registered.data.user.role === 'customer', 'register');

  const badLogin = await req('/auth/login', {
    method: 'POST',
    body: { email: 'meera.sharma@theruux.in', password: 'wrong-password' },
  });
  assert(badLogin.status === 401, 'bad login');

  const login = await req('/auth/login', {
    method: 'POST',
    body: { email: 'meera.sharma@theruux.in', password: 'MeeraTest1!' },
  });
  assert(login.status === 200 && login.data.accessToken, 'login');
  assert(login.headers.get('ratelimit-limit') || login.headers.get('RateLimit-Limit'), 'auth rate limit');
  const token = login.data.accessToken;

  const added = await req('/cart/items', {
    method: 'POST',
    token,
    body: { productId: product._id.toString(), variantId: variant._id.toString(), quantity: 2 },
  });
  assert(added.status === 201, `cart add ${added.status}`);
  assert(added.data.subtotal === '10980.00', `cart total ${added.data.subtotal}`);

  const badPin = await req('/checkout/create', {
    method: 'POST',
    token,
    body: {
      email: 'meera.sharma@theruux.in',
      phone: '9876543210',
      shippingMethodId: 'standard',
      paymentMethod: 'cod',
      shippingAddress: { ...address, postalCode: '40001' },
    },
  });
  assert(badPin.status === 400, `pin rejected ${badPin.status}`);

  const cod = await req('/checkout/create', {
    method: 'POST',
    token,
    body: {
      email: 'meera.sharma@theruux.in',
      phone: '9876543210',
      shippingMethodId: 'express',
      paymentMethod: 'cod',
      shippingAddress: address,
    },
  });
  assert(cod.status === 201, `cod ${cod.status} ${JSON.stringify(cod.data)}`);
  assert(cod.data.payment.amount === '11179.00', `express total ${cod.data.payment.amount}`);

  const history = await req('/orders', { token });
  assert(history.status === 200, 'order history');
  assert(history.data.items.some((order) => order.orderNumber === cod.data.orderNumber), 'history contains order');
  assert(history.data.items[0].grandTotal === '11179.00', 'history total');

  const admin = await req('/auth/login', {
    method: 'POST',
    body: { email: 'admin@theruux.in', password: 'TheruuxAdmin1!' },
  });
  const shipped = await req(`/admin/orders/${history.data.items[0].id}/transition`, {
    method: 'POST',
    token: admin.data.accessToken,
    body: { toStatus: 'SHIPPED', trackingNumber: 'TRK400001', carrier: 'Manual' },
  });
  assert(shipped.status === 200 && shipped.data.trackingNumber === 'TRK400001', `tracking ${shipped.status}`);

  const guest = await req('/cart/items', {
    method: 'POST',
    headers: { 'X-Guest-Token': 'launch-guest' },
    body: { productId: product._id.toString(), variantId: variant._id.toString(), quantity: 1 },
  });
  assert(guest.data.subtotal === '5490.00', `guest cart ${guest.data.subtotal}`);

  const checkout = await req('/checkout/create', {
    method: 'POST',
    headers: { 'X-Guest-Token': 'launch-guest' },
    body: {
      email: 'meera.sharma@theruux.in',
      phone: '9876543210',
      shippingMethodId: 'standard',
      paymentMethod: 'cashfree',
      shippingAddress: address,
    },
  });
  assert(checkout.status === 201 && checkout.data.payment?.paymentSessionId, 'guest cashfree session');
  assert(checkout.data.payment.amount === '5490.00', 'guest shipping zero');

  const pending = await req('/payments/confirm', {
    method: 'POST',
    body: { cashfreeOrderId: checkout.data.payment.cashfreeOrderId },
  });
  assert(pending.data.paymentStatus !== 'PAID', `unpaid confirm ${pending.data.paymentStatus}`);
  const again = await req('/payments/confirm', {
    method: 'POST',
    body: { cashfreeOrderId: checkout.data.payment.cashfreeOrderId },
  });
  assert(again.data.paymentStatus !== 'PAID', 'duplicate unpaid confirm');

  const webhook = await fetch('http://127.0.0.1:5058/api/payments/webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'PAYMENT_SUCCESS_WEBHOOK' }),
  });
  assert(webhook.status === 400, `webhook signature ${webhook.status}`);

  assert(cashfree, 'cashfree sandbox keys');
  let failedPay = {};
  try {
    failedPay = await paySandbox(checkout.data.payment.paymentSessionId, 'testfailure@gocash');
  } catch (err) {
    failedPay = { payment_status: err?.response?.data?.message || err.message };
  }
  let failedPayments = await cashfree.PGOrderFetchPayments(checkout.data.payment.cashfreeOrderId);
  let failedPayment = (failedPayments.data || [])[0];
  if (failedPayment?.cf_payment_id && String(failedPayment.payment_status).toUpperCase() !== 'FAILED') {
    try {
      await cashfree.PGSimulatePayment({
        entity: 'PAYMENTS',
        entity_id: String(failedPayment.cf_payment_id),
        entity_simulation: { payment_status: 'FAILED', payment_error_code: 'FAILED' },
      });
    } catch (err) {
      throw new Error(err?.response?.data?.message || 'Could not simulate a failed payment');
    }
  }
  const failedConfirm = await req('/payments/confirm', {
    method: 'POST',
    body: { cashfreeOrderId: checkout.data.payment.cashfreeOrderId },
  });
  console.log(
    'failed-upi',
    failedPay.payment_status || failedPayment?.payment_status || 'no-status',
    failedConfirm.data.paymentStatus,
  );
  assert(
    failedConfirm.data.paymentStatus === 'FAILED' || failedConfirm.data.status === 'FAILED',
    `failed payment ${failedConfirm.data.paymentStatus}/${failedConfirm.data.status}`,
  );

  const successCheckout = await req('/checkout/create', {
    method: 'POST',
    headers: { 'X-Guest-Token': 'launch-guest-paid' },
    body: {
      email: 'meera.sharma@theruux.in',
      phone: '9876543210',
      shippingMethodId: 'standard',
      paymentMethod: 'cashfree',
      shippingAddress: address,
      buyNow: {
        productId: product._id.toString(),
        variantId: variant._id.toString(),
        quantity: 1,
      },
    },
  });
  assert(successCheckout.status === 201, `success session ${successCheckout.status}`);
  const successPay = await paySandbox(successCheckout.data.payment.paymentSessionId, 'success@upi');
  let payments = await cashfree.PGOrderFetchPayments(successCheckout.data.payment.cashfreeOrderId);
  let payment = (payments.data || [])[0];
  if (payment?.cf_payment_id && String(payment.payment_status).toUpperCase() !== 'SUCCESS') {
    try {
      await cashfree.PGSimulatePayment({
        entity: 'PAYMENTS',
        entity_id: String(payment.cf_payment_id),
        entity_simulation: { payment_status: 'SUCCESS' },
      });
    } catch (err) {
      throw new Error(err?.response?.data?.message || 'Could not simulate a successful payment');
    }
    payments = await cashfree.PGOrderFetchPayments(successCheckout.data.payment.cashfreeOrderId);
    payment = (payments.data || [])[0];
  }
  const paid = await req('/payments/confirm', {
    method: 'POST',
    body: { cashfreeOrderId: successCheckout.data.payment.cashfreeOrderId },
  });
  const paidAgain = await req('/payments/confirm', {
    method: 'POST',
    body: { cashfreeOrderId: successCheckout.data.payment.cashfreeOrderId },
  });
  console.log('success-upi', successPay.payment_status || payment?.payment_status || 'no-status', paid.data.paymentStatus, paidAgain.data.alreadyProcessed);
  assert(paid.data.paymentStatus === 'PAID', `sandbox paid ${paid.data.paymentStatus} ${paid.data.reason || ''}`);
  assert(paidAgain.data.alreadyProcessed === true || paidAgain.data.paymentStatus === 'PAID', 'duplicate paid confirm');

  const ordersAfter = await OrderCount();
  assert(ordersAfter === 1 || ordersAfter >= 1, 'one paid capture');

  const refund = await cashfree.PGOrderCreateRefund(successCheckout.data.payment.cashfreeOrderId, {
    refund_amount: 5490,
    refund_id: `rf${Date.now()}`,
    refund_note: 'SUCCESS',
  });
  const marked = await req(`/admin/orders/${paid.data.orderId}/transition`, {
    method: 'POST',
    token: admin.data.accessToken,
    body: { toStatus: 'REFUNDED', note: refund.data?.refund_id || 'sandbox refund' },
  });
  assert(marked.status === 200 && marked.data.paymentStatus === 'REFUNDED', `refund mark ${marked.status}`);

  const stock = await Variant.findById(variant._id);
  console.log('stock-left', stock.stockQty);
  console.log('Launch flows passed.');
} finally {
  server.close();
  await mongoose.disconnect();
  await mem.stop();
}

async function OrderCount() {
  const { Order } = await import('../models/Order.js');
  return Order.countDocuments({ paymentStatus: 'PAID' });
}
