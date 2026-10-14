import { Variant } from '../models/Variant.js';
import { InventoryAdjustment } from '../models/InventoryAdjustment.js';
import { Product } from '../models/Product.js';
import { AppError } from '../utils/errors.js';
import { env } from '../config/env.js';
import { Settings } from '../models/Settings.js';

export const assertAvailable = async (variantId, qty) => {
  const variant = await Variant.findById(variantId);
  if (!variant || !variant.isActive) {
    throw new AppError(400, 'NOT_PURCHASABLE', 'Variant unavailable');
  }
  if (variant.stockQty < qty) {
    throw new AppError(409, 'OUT_OF_STOCK', 'Not enough stock');
  }
  return variant;
};

const sessionOpts = (session) => (session ? { session } : {});

const HOLDING_STATUSES = new Set(['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED']);

export const orderHoldsStock = (status) => HOLDING_STATUSES.has(status);

export const reservedUnitsByVariant = async (orderId, session) => {
  let query = InventoryAdjustment.find({ orderId });
  if (session) query = query.session(session);
  const rows = await query.lean();
  const net = new Map();
  for (const row of rows) {
    const key = String(row.variantId);
    net.set(key, (net.get(key) || 0) + row.delta);
  }
  return net;
};

export const reserveOrderStock = async (order, { session, reason, adminId } = {}) => {
  const net = await reservedUnitsByVariant(order._id, session);
  for (const item of order.items || []) {
    const already = -(net.get(String(item.variantId)) || 0);
    const need = item.quantity - already;
    if (need <= 0) continue;
    // Conditional $inc: two concurrent captures can't both take the last unit.
    const variant = await Variant.findOneAndUpdate(
      { _id: item.variantId, stockQty: { $gte: need } },
      { $inc: { stockQty: -need } },
      { new: true, ...sessionOpts(session) },
    );
    if (!variant) {
      throw new AppError(409, 'OUT_OF_STOCK', `Insufficient stock for ${item.sku || 'item'}`);
    }
    await InventoryAdjustment.create(
      [
        {
          variantId: variant._id,
          delta: -need,
          reason: reason || 'order_reserve',
          orderId: order._id,
          adminId: adminId || null,
        },
      ],
      sessionOpts(session),
    );
  }
};

export const releaseOrderStock = async (order, { session, reason, adminId } = {}) => {
  const net = await reservedUnitsByVariant(order._id, session);
  for (const item of order.items || []) {
    const taken = -(net.get(String(item.variantId)) || 0);
    if (taken <= 0) continue;
    const restore = Math.min(taken, item.quantity);
    const variant = await Variant.findOneAndUpdate(
      { _id: item.variantId },
      { $inc: { stockQty: restore } },
      { new: true, ...sessionOpts(session) },
    );
    if (!variant) continue;
    await InventoryAdjustment.create(
      [
        {
          variantId: variant._id,
          delta: restore,
          reason: reason || 'order_release',
          orderId: order._id,
          adminId: adminId || null,
        },
      ],
      sessionOpts(session),
    );
  }
};

export const adjustStock = async ({ variantId, delta, reason, adminId }) => {
  const change = Number(delta);
  if (!Number.isInteger(change) || change === 0) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Adjustment must be a whole number other than zero');
  }
  // Single conditional update: no lost writes and never below zero.
  const variant = await Variant.findOneAndUpdate(
    { _id: variantId, ...(change < 0 ? { stockQty: { $gte: -change } } : {}) },
    { $inc: { stockQty: change } },
    { new: true },
  );
  if (!variant) {
    if (await Variant.exists({ _id: variantId })) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Stock cannot go negative');
    }
    throw new AppError(404, 'NOT_FOUND', 'Variant not found');
  }
  await InventoryAdjustment.create({ variantId, delta: change, reason, adminId });
  return variant;
};

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const listInventory = async ({ q, lowStock, stock, page = 1, pageSize = 50 } = {}) => {
  const settings = await Settings.findOne({ key: 'store' }).lean();
  const threshold = settings?.lowStockThreshold ?? env.lowStockThreshold;
  const limit = Math.min(Math.max(Number(pageSize) || 50, 1), 200);
  const current = Math.max(Number(page) || 1, 1);

  const filter = {};
  if (q) {
    const rx = new RegExp(escapeRegex(String(q).trim()), 'i');
    const matches = await Product.find({ $or: [{ name: rx }, { title: rx }] }).select('_id').limit(200).lean();
    filter.$or = [{ sku: rx }, { productId: { $in: matches.map((p) => p._id) } }];
  }
  if (stock === 'out') filter.stockQty = { $lte: 0 };
  else if (stock === 'low' || lowStock === true || lowStock === 'true') {
    filter.stockQty = { $gt: 0, $lte: threshold };
  }

  const [variants, total] = await Promise.all([
    Variant.find(filter)
      .sort({ stockQty: 1, sku: 1 })
      .skip((current - 1) * limit)
      .limit(limit)
      .lean(),
    Variant.countDocuments(filter),
  ]);
  const productIds = [...new Set(variants.map((v) => String(v.productId)))];
  const products = await Product.find({ _id: { $in: productIds } }).select('name title slug images').lean();
  const pMap = Object.fromEntries(products.map((p) => [String(p._id), p]));

  return {
    threshold,
    page: current,
    pageSize: limit,
    total,
    items: variants.map((v) => {
      const p = pMap[String(v.productId)];
      return {
        id: v._id.toString(),
        sku: v.sku,
        size: v.size,
        colourName: v.colourName,
        stockQty: v.stockQty,
        isActive: v.isActive,
        lowStock: v.stockQty <= threshold,
        stockStatus: v.stockQty <= 0 ? 'out' : v.stockQty <= threshold ? 'low' : 'in',
        updatedAt: v.updatedAt,
        product: p
          ? {
              id: p._id.toString(),
              name: p.name,
              title: p.title,
              slug: p.slug,
              imageUrl: [...(p.images || [])].sort((a, b) => a.sortOrder - b.sortOrder)[0]?.url || '',
            }
          : null,
      };
    }),
  };
};

export const getAdjustmentHistory = async (variantId) => {
  const rows = await InventoryAdjustment.find({ variantId })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();
  return rows.map((r) => ({
    id: r._id.toString(),
    delta: r.delta,
    reason: r.reason,
    orderId: r.orderId?.toString() || null,
    adminId: r.adminId?.toString() || null,
    at: r.createdAt,
  }));
};
