import { Order } from '../models/Order.js';
import { Address } from '../models/Address.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/errors.js';
import { formatMoney } from '../utils/money.js';
import { getCommerceConfig } from './commerce-config.service.js';

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
  };
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
