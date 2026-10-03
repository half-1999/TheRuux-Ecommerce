import { Order } from '../models/Order.js';
import { Address } from '../models/Address.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/errors.js';
import { formatMoney } from '../utils/money.js';

export const listMyOrders = async (userId) => {
  const orders = await Order.find({ userId }).sort({ placedAt: -1 }).lean();
  return {
    items: orders.map((o) => ({
      id: o._id.toString(),
      orderNumber: o.orderNumber,
      status: o.status,
      paymentStatus: o.paymentStatus,
      paymentMethod: o.paymentMethod || '',
      shippingMethodId: o.shippingMethodId || '',
      grandTotal: formatMoney(o.grandTotal),
      currency: o.currency,
      placedAt: o.placedAt,
      itemCount: o.items.reduce((n, i) => n + i.quantity, 0),
    })),
  };
};

export const getMyOrder = async (userId, orderNumber) => {
  const order = await Order.findOne({ orderNumber, userId }).lean();
  if (!order) throw new AppError(404, 'NOT_FOUND', 'Order not found');
  return {
    ...order,
    id: order._id.toString(),
    subtotal: formatMoney(order.subtotal),
    shipping: formatMoney(order.shipping),
    tax: formatMoney(order.tax),
    grandTotal: formatMoney(order.grandTotal),
    items: order.items.map((i) => ({
      ...i,
      id: i._id.toString(),
      unitPrice: formatMoney(i.unitPrice),
      lineTotal: formatMoney(i.lineTotal),
    })),
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
