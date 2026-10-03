import { Settings } from '../models/Settings.js';
import { AppError } from '../utils/errors.js';
import { toMoney } from '../utils/money.js';

const DEFAULT_PAYMENTS = [
  { id: 'razorpay', label: 'Razorpay', detail: 'UPI, cards, netbanking', enabled: true },
  {
    id: 'cod',
    label: 'Cash on delivery',
    detail: 'Pay with cash when the order arrives',
    enabled: true,
  },
];

const DEFAULT_SHIPPING = [
  { id: 'standard', name: 'Standard', priceInr: 0, estimate: '3–5 business days', enabled: true },
  { id: 'express', name: 'Express', priceInr: 199, estimate: '1–2 business days', enabled: true },
];

const slugify = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40);

export const loadCommerceSettings = async () => {
  let settings = await Settings.findOne({ key: 'store' });
  if (!settings) settings = await Settings.create({ key: 'store' });

  let dirty = false;
  if (!settings.paymentMethods?.length) {
    settings.paymentMethods = DEFAULT_PAYMENTS;
    dirty = true;
  }
  if (!settings.shippingMethods?.length) {
    settings.shippingMethods = DEFAULT_SHIPPING.map((method) =>
      method.id === 'standard'
        ? { ...method, priceInr: settings.shippingStandardInr ?? 0 }
        : method,
    );
    dirty = true;
  }
  if (dirty) await settings.save();
  return settings;
};

const publicPayment = (method) => ({
  id: method.id,
  label: method.label,
  detail: method.detail || '',
  enabled: Boolean(method.enabled),
});

const publicShipping = (method) => ({
  id: method.id,
  name: method.name,
  label: method.name,
  price: toMoney(method.priceInr || 0),
  priceInr: toMoney(method.priceInr || 0),
  estimate: method.estimate || '',
  detail: method.estimate || '',
  enabled: Boolean(method.enabled),
});

export const getCommerceConfig = async () => {
  const settings = await loadCommerceSettings();
  return {
    paymentMethods: settings.paymentMethods.map(publicPayment),
    shippingMethods: settings.shippingMethods.map(publicShipping),
  };
};

export const getEnabledCommerce = async () => {
  const config = await getCommerceConfig();
  return {
    paymentMethods: config.paymentMethods.filter((method) => method.enabled),
    shippingMethods: config.shippingMethods.filter((method) => method.enabled),
  };
};

export const createPaymentMethod = async (body) => {
  const settings = await loadCommerceSettings();
  const label = String(body.label || '').trim();
  if (!label) throw new AppError(400, 'VALIDATION_ERROR', 'Payment label required');
  let id = slugify(body.id || label) || `pay-${Date.now()}`;
  if (id === 'razorpay') throw new AppError(400, 'VALIDATION_ERROR', 'Razorpay already exists');
  if (settings.paymentMethods.some((method) => method.id === id)) id = `${id}-${Date.now()}`;
  settings.paymentMethods.push({
    id,
    label,
    detail: String(body.detail || '').trim(),
    enabled: body.enabled !== false,
  });
  await settings.save();
  return getCommerceConfig();
};

export const updatePaymentMethod = async (id, body) => {
  const settings = await loadCommerceSettings();
  const method = settings.paymentMethods.find((item) => item.id === id);
  if (!method) throw new AppError(404, 'NOT_FOUND', 'Payment method not found');
  if (body.label != null) method.label = String(body.label).trim();
  if (body.detail != null) method.detail = String(body.detail).trim();
  if (body.enabled != null) method.enabled = Boolean(body.enabled);
  await settings.save();
  return getCommerceConfig();
};

export const deletePaymentMethod = async (id) => {
  const settings = await loadCommerceSettings();
  const next = settings.paymentMethods.filter((item) => item.id !== id);
  if (next.length === settings.paymentMethods.length) {
    throw new AppError(404, 'NOT_FOUND', 'Payment method not found');
  }
  if (!next.length) throw new AppError(400, 'VALIDATION_ERROR', 'Keep at least one payment method');
  settings.paymentMethods = next;
  await settings.save();
  return getCommerceConfig();
};

export const createShippingMethod = async (body) => {
  const settings = await loadCommerceSettings();
  const name = String(body.name || '').trim();
  if (!name) throw new AppError(400, 'VALIDATION_ERROR', 'Shipping name required');
  let id = slugify(body.id || name) || `ship-${Date.now()}`;
  if (settings.shippingMethods.some((method) => method.id === id)) id = `${id}-${Date.now()}`;
  settings.shippingMethods.push({
    id,
    name,
    priceInr: toMoney(body.priceInr ?? 0),
    estimate: String(body.estimate || '').trim(),
    enabled: body.enabled !== false,
  });
  await settings.save();
  return getCommerceConfig();
};

export const updateShippingMethod = async (id, body) => {
  const settings = await loadCommerceSettings();
  const method = settings.shippingMethods.find((item) => item.id === id);
  if (!method) throw new AppError(404, 'NOT_FOUND', 'Shipping method not found');
  if (body.name != null) method.name = String(body.name).trim();
  if (body.priceInr != null) method.priceInr = toMoney(body.priceInr);
  if (body.estimate != null) method.estimate = String(body.estimate).trim();
  if (body.enabled != null) method.enabled = Boolean(body.enabled);
  await settings.save();
  return getCommerceConfig();
};

export const deleteShippingMethod = async (id) => {
  const settings = await loadCommerceSettings();
  const next = settings.shippingMethods.filter((item) => item.id !== id);
  if (next.length === settings.shippingMethods.length) {
    throw new AppError(404, 'NOT_FOUND', 'Shipping method not found');
  }
  settings.shippingMethods = next;
  await settings.save();
  return getCommerceConfig();
};

export const resolveCheckoutMethods = async ({ shippingMethodId, paymentMethod }) => {
  const { paymentMethods, shippingMethods } = await getEnabledCommerce();
  const shipping = shippingMethods.find((method) => method.id === shippingMethodId);
  const payment = paymentMethods.find((method) => method.id === paymentMethod);
  if (!shipping) throw new AppError(400, 'VALIDATION_ERROR', 'Choose an available shipping method');
  if (!payment) throw new AppError(400, 'VALIDATION_ERROR', 'Choose an available payment method');
  return { shipping, payment };
};
