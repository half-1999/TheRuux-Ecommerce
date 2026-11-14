import { Order } from '../models/Order.js';
import { Address } from '../models/Address.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/errors.js';
import { formatMoney } from '../utils/money.js';
import { getCommerceConfig } from './commerce-config.service.js';
import { orderHoldsStock, releaseOrderStock } from './inventory.service.js';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
export const CANCEL_WINDOW_MS = 2 * HOUR;
export const RETURN_WINDOW_MS = 3 * DAY;
export const EXCHANGE_WINDOW_MS = 7 * DAY;

const isPendingOrder = (order) =>
  order.status === 'PENDING_PAYMENT' ||
  (order.status === 'PROCESSING' && order.paymentStatus === 'PENDING');

const deliveredMoment = (order) => {
  if (!['DELIVERED', 'COMPLETED'].includes(order.status)) return null;
  if (order.deliveredAt) return new Date(order.deliveredAt);
  const hit = (order.timeline || []).find((entry) => entry.status === 'DELIVERED' && entry.at);
  return hit ? new Date(hit.at) : null;
};

export const orderActions = (order, now = Date.now()) => {
  const placed = new Date(order.placedAt || order.createdAt || 0).getTime();
  const cancelUntil = placed + CANCEL_WINDOW_MS;
  const delivered = deliveredMoment(order);
  const returnUntil = delivered ? delivered.getTime() + RETURN_WINDOW_MS : null;
  const exchangeUntil = delivered ? delivered.getTime() + EXCHANGE_WINDOW_MS : null;
  const open = !order.aftercare?.type;
  return {
    canCancel: isPendingOrder(order) && now <= cancelUntil,
    cancelUntil: new Date(cancelUntil).toISOString(),
    canReturn: Boolean(open && returnUntil && now <= returnUntil),
    returnUntil: returnUntil ? new Date(returnUntil).toISOString() : null,
    canExchange: Boolean(open && exchangeUntil && now <= exchangeUntil),
    exchangeUntil: exchangeUntil ? new Date(exchangeUntil).toISOString() : null,
  };
};

const presentAftercare = (aftercare) =>
  aftercare?.type
    ? { type: aftercare.type, reason: aftercare.reason || '', requestedAt: aftercare.requestedAt || null }
    : null;

const FALLBACK_PAYMENTS = {
  cashfree: { label: 'Cashfree', detail: 'UPI, cards, netbanking' },
  cod: { label: 'Cash on delivery', detail: 'Pay with cash when the order arrives' },
};

const FALLBACK_SHIPPING = {
  standard: { label: 'Standard', estimate: '3–5 business days' },
  express: { label: 'Express', estimate: '1–2 business days' },
};

const commerceMaps = async () => {
  const config = await getCommerceConfig();
  return {
    payments: Object.fromEntries(config.paymentMethods.map((method) => [method.id, method])),
    shipping: Object.fromEntries(config.shippingMethods.map((method) => [method.id, method])),
  };
};

const paymentCopy = (id, payments) => {
  const method = payments[id] || FALLBACK_PAYMENTS[id];
  return {
    paymentMethod: id || '',
    paymentLabel: method?.label || id || '',
    paymentDetail: method?.detail || '',
  };
};

const shippingCopy = (id, shipping) => {
  const method = shipping[id];
  const fallback = FALLBACK_SHIPPING[id];
  return {
    shippingMethodId: id || '',
    shippingLabel: method?.label || method?.name || fallback?.label || id || '',
    shippingEstimate: method?.estimate || method?.detail || fallback?.estimate || '',
  };
};

const presentItem = (item) => ({
  id: item._id?.toString?.() || '',
  productId: item.productId ? String(item.productId) : '',
  productName: item.productName || '',
  productTitle: item.productTitle || '',
  productSlug: item.productSlug || '',
  sku: item.sku || '',
  size: item.size || '',
  colourName: item.colourName || '',
  quantity: item.quantity || 0,
  unitPrice: formatMoney(item.unitPrice),
  lineTotal: formatMoney(item.lineTotal),
  imageUrl: item.imageUrl || '',
  personalization:
    item.personalization?.textFront || item.personalization?.textBack
      ? {
          textFront: item.personalization.textFront || '',
          textBack: item.personalization.textBack || '',
        }
      : null,
});

const presentTimeline = (timeline) =>
  (timeline || []).map((entry) => ({
    status: entry.status || '',
    note: entry.note || '',
    at: entry.at || null,
  }));

export const listMyOrders = async (userId) => {
  const [orders, maps] = await Promise.all([
    Order.find({ userId }).sort({ placedAt: -1 }).lean(),
    commerceMaps(),
  ]);
  return {
    items: orders.map((order) => ({
      id: order._id.toString(),
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      statusReason: order.statusReason || '',
      ...paymentCopy(order.paymentMethod, maps.payments),
      ...shippingCopy(order.shippingMethodId, maps.shipping),
      email: order.email,
      phone: order.phone || '',
      subtotal: formatMoney(order.subtotal),
      shipping: formatMoney(order.shipping),
      tax: formatMoney(order.tax),
      grandTotal: formatMoney(order.grandTotal),
      currency: order.currency,
      placedAt: order.placedAt,
      paidAt: order.paidAt,
      deliveredAt: order.deliveredAt || null,
      aftercare: presentAftercare(order.aftercare),
      actions: orderActions(order),
      trackingNumber: order.trackingNumber || '',
      carrier: order.carrier || '',
      itemCount: (order.items || []).reduce((count, item) => count + (item.quantity || 0), 0),
      items: (order.items || []).map(presentItem),
    })),
  };
};

export const getMyOrder = async (userId, orderNumber) => {
  const [order, maps] = await Promise.all([
    Order.findOne({ orderNumber, userId }).lean(),
    commerceMaps(),
  ]);
  if (!order) throw new AppError(404, 'NOT_FOUND', 'Order not found');
  return {
    ...order,
    id: order._id.toString(),
    statusReason: order.statusReason || '',
    ...paymentCopy(order.paymentMethod, maps.payments),
    ...shippingCopy(order.shippingMethodId, maps.shipping),
    trackingNumber: order.trackingNumber || '',
    carrier: order.carrier || '',
    subtotal: formatMoney(order.subtotal),
    shipping: formatMoney(order.shipping),
    tax: formatMoney(order.tax),
    grandTotal: formatMoney(order.grandTotal),
    itemCount: (order.items || []).reduce((count, item) => count + (item.quantity || 0), 0),
    items: (order.items || []).map(presentItem),
    timeline: presentTimeline(order.timeline),
    deliveredAt: order.deliveredAt || null,
    aftercare: presentAftercare(order.aftercare),
    actions: orderActions(order),
  };
};

const ownOrder = async (userId, orderNumber) => {
  const order = await Order.findOne({ orderNumber, userId });
  if (!order) throw new AppError(404, 'NOT_FOUND', 'Order not found');
  return order;
};

export const cancelMyOrder = async (userId, orderNumber) => {
  const order = await ownOrder(userId, orderNumber);
  const actions = orderActions(order);
  if (!isPendingOrder(order)) {
    throw new AppError(400, 'NOT_CANCELLABLE', 'Only a pending order can be cancelled.');
  }
  if (!actions.canCancel) {
    throw new AppError(400, 'CANCEL_WINDOW_CLOSED', 'A pending order can be cancelled only within 2 hours of placing it.');
  }
  if (orderHoldsStock(order.status)) {
    await releaseOrderStock(order, { reason: 'customer_cancel' });
  }
  order.status = 'CANCELLED';
  order.statusReason = 'Cancelled by the customer within 2 hours.';
  order.timeline.push({ status: 'CANCELLED', note: order.statusReason, at: new Date() });
  await order.save();
  const { sendCancelledNotice } = await import('./email.service.js');
  sendCancelledNotice(order).catch((err) => console.error('[order] cancel email failed:', err.message));
  return getMyOrder(userId, orderNumber);
};

export const requestAftercare = async (userId, orderNumber, { type, reason }) => {
  const order = await ownOrder(userId, orderNumber);
  const cleanReason = String(reason || '').trim();
  if (cleanReason.length < 8) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Tell us the reason in a sentence.');
  }
  if (order.aftercare?.type) {
    throw new AppError(409, 'AFTERCARE_EXISTS', 'This order already has a return or exchange request.');
  }
  const actions = orderActions(order);
  const allowed = type === 'return' ? actions.canReturn : type === 'exchange' ? actions.canExchange : false;
  if (!allowed) {
    const window = type === 'return' ? '3 days' : '7 days';
    throw new AppError(
      400,
      'WINDOW_CLOSED',
      type === 'return' || type === 'exchange'
        ? `A ${type} is available for ${window} after delivery.`
        : 'Choose a return or an exchange.',
    );
  }
  order.aftercare = { type, reason: cleanReason.slice(0, 500), requestedAt: new Date() };
  order.timeline.push({
    status: order.status,
    note: `${type === 'return' ? 'Return' : 'Exchange'} requested: ${order.aftercare.reason}`,
    at: order.aftercare.requestedAt,
  });
  await order.save();
  const { sendAftercareNotice } = await import('./email.service.js');
  sendAftercareNotice(order).catch((err) => console.error('[order] aftercare email failed:', err.message));
  return getMyOrder(userId, orderNumber);
};

export const getMe = async (userId) => {
  const user = await User.findById(userId).select('-passwordHash -refreshTokenHash');
  if (!user) throw new AppError(404, 'NOT_FOUND', 'User not found');
  return user.toSafeJSON();
};

export const updateMe = async (userId, { name, phone }) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, 'NOT_FOUND', 'User not found');
  if (name != null) {
    if (!String(name).trim()) throw new AppError(400, 'VALIDATION_ERROR', 'Name required');
    user.name = name.trim();
  }
  if (phone != null) user.phone = phone;
  await user.save();
  return user.toSafeJSON();
};

export const listAddresses = async (userId) => {
  const rows = await Address.find({ userId }).sort({ isDefault: -1, createdAt: -1 }).lean();
  return {
    items: rows.map((a) => ({ ...a, id: a._id.toString() })),
  };
};

export const createAddress = async (userId, body) => {
  if (body.isDefault) {
    await Address.updateMany({ userId }, { isDefault: false });
  }
  const addr = await Address.create({ ...body, userId });
  return { ...addr.toObject(), id: addr._id.toString() };
};

export const updateAddress = async (userId, id, body) => {
  const addr = await Address.findOne({ _id: id, userId });
  if (!addr) throw new AppError(404, 'NOT_FOUND', 'Address not found');
  if (body.isDefault) {
    await Address.updateMany({ userId }, { isDefault: false });
  }
  Object.assign(addr, body);
  await addr.save();
  return { ...addr.toObject(), id: addr._id.toString() };
};

export const deleteAddress = async (userId, id) => {
  const result = await Address.deleteOne({ _id: id, userId });
  if (!result.deletedCount) throw new AppError(404, 'NOT_FOUND', 'Address not found');
  return { ok: true };
};

export const setDefaultAddress = async (userId, id) => {
  const addr = await Address.findOne({ _id: id, userId });
  if (!addr) throw new AppError(404, 'NOT_FOUND', 'Address not found');
  await Address.updateMany({ userId }, { isDefault: false });
  addr.isDefault = true;
  await addr.save();
  return { ...addr.toObject(), id: addr._id.toString() };
};
